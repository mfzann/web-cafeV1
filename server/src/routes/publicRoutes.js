import express from 'express';
import { getDb } from '../config/database.js';
import { createMidtransTransaction } from '../services/midtransService.js';

const router = express.Router();

// Helper to check if cafe is currently open based on operational hours setting
function isCafeOpen(opHoursJson) {
  if (!opHoursJson) return { isOpen: true, message: '' };
  try {
    const hours = JSON.parse(opHoursJson);
    const now = new Date();
    const currentDay = now.getDay(); // 0-6 (Sun-Sat)
    const todayHours = hours.find(h => h.day === currentDay);

    if (!todayHours || !todayHours.is_active) {
      return { isOpen: false, message: 'Cafe tutup pada hari ini.' };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
      return {
        isOpen: false,
        message: `Cafe sedang tutup. Jam operasional hari ini: ${todayHours.open} - ${todayHours.close} WIB.`
      };
    }

    return { isOpen: true, message: 'Open' };
  } catch (err) {
    return { isOpen: true, message: 'Open' };
  }
}

// 1. Get Public Settings (Cafe info, Operational status, Default Theme)
router.get('/settings', async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all('SELECT key, value FROM settings');
    const settingsObj = {};
    rows.forEach(r => {
      settingsObj[r.key] = r.value;
    });

    const openStatus = isCafeOpen(settingsObj.operational_hours);

    res.json({
      success: true,
      data: {
        cafe_name: settingsObj.cafe_name || 'CafeOrder Bistro',
        cafe_address: settingsObj.cafe_address || '',
        tax_rate: parseFloat(settingsObj.tax_rate || '10'),
        service_fee: parseFloat(settingsObj.service_fee || '5'),
        default_theme: settingsObj.default_theme || 'warm',
        operational_status: openStatus,
        operational_hours: settingsObj.operational_hours ? JSON.parse(settingsObj.operational_hours) : []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Validate Table Number
router.get('/tables/validate/:tableNumber', async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const db = await getDb();
    const table = await db.get('SELECT * FROM tables WHERE table_number = ?', [tableNumber]);

    if (!table) {
      return res.status(404).json({ success: false, message: `Meja Nomor ${tableNumber} tidak ditemukan di database cafe.` });
    }

    res.json({
      success: true,
      data: table
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Get Public Menu Items
router.get('/menu', async (req, res) => {
  try {
    const db = await getDb();
    const items = await db.all('SELECT * FROM menu_items ORDER BY category ASC, name ASC');
    res.json({
      success: true,
      data: items.map(i => ({
        ...i,
        is_available: Boolean(i.is_available)
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Create Order (Checkout)
router.post('/orders', async (req, res) => {
  try {
    const { customer_name, table_number, order_type, items, notes } = req.body;
    const db = await getDb();

    // Check operational hours
    const opHoursRow = await db.get("SELECT value FROM settings WHERE key = 'operational_hours'");
    const status = isCafeOpen(opHoursRow?.value);
    if (!status.isOpen) {
      return res.status(403).json({ success: false, message: status.message });
    }

    // Validate order details
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Keranjang belanja tidak boleh kosong.' });
    }

    if (order_type === 'dine_in' && !table_number) {
      return res.status(400).json({ success: false, message: 'Nomor meja wajib diisi untuk opsi Makan di Tempat (Dine In).' });
    }

    let tableId = null;
    if (order_type === 'dine_in') {
      const table = await db.get('SELECT id FROM tables WHERE table_number = ?', [table_number]);
      if (!table) {
        return res.status(400).json({ success: false, message: `Nomor meja ${table_number} tidak terdaftar.` });
      }
      tableId = table.id;
    }

    // Fetch tax & service fee
    const taxRow = await db.get("SELECT value FROM settings WHERE key = 'tax_rate'");
    const serviceRow = await db.get("SELECT value FROM settings WHERE key = 'service_fee'");
    const taxRate = parseFloat(taxRow?.value || '10');
    const serviceFeeRate = parseFloat(serviceRow?.value || '5');

    // Verify items and calculate total
    let itemsSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const menuItem = await db.get('SELECT * FROM menu_items WHERE id = ?', [item.menu_item_id]);
      if (!menuItem) {
        return res.status(400).json({ success: false, message: `Menu dengan ID ${item.menu_item_id} tidak ditemukan.` });
      }
      if (!menuItem.is_available) {
        return res.status(400).json({ success: false, message: `Menu "${menuItem.name}" sedang habis/tidak tersedia.` });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10));
      const subtotal = menuItem.price * qty;
      itemsSubtotal += subtotal;

      validatedItems.push({
        id: `ori-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        unit_price: menuItem.price,
        quantity: qty,
        note: item.note || '',
        subtotal
      });
    }

    const taxAmount = (itemsSubtotal * taxRate) / 100;
    const serviceAmount = (itemsSubtotal * serviceFeeRate) / 100;
    const grandTotal = itemsSubtotal + taxAmount + serviceAmount;

    // Generate Order ID format: ORD-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-${dateStr}-${randCode}`;

    // Create Order DB entry
    await db.run(
      `INSERT INTO orders (id, table_id, table_number, order_type, status, payment_status, total_amount, customer_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, tableId, order_type === 'dine_in' ? parseInt(table_number, 10) : null, order_type, 'pending', 'pending', grandTotal, customer_name || 'Pelanggan', notes || '']
    );

    // Insert Order Items
    for (const vi of validatedItems) {
      await db.run(
        `INSERT INTO order_items (id, order_id, menu_item_id, item_name, unit_price, quantity, note, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [vi.id, orderId, vi.menu_item_id, vi.item_name, vi.unit_price, vi.quantity, vi.note, vi.subtotal]
      );
    }

    const createdOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);

    // Create Midtrans snap token transaction
    const midtransRes = await createMidtransTransaction(createdOrder, validatedItems);

    // Update order with snap token
    await db.run('UPDATE orders SET snap_token = ? WHERE id = ?', [midtransRes.snapToken, orderId]);

    // Emit real-time notification to admin dashboard room
    const io = req.app.get('socketio');
    if (io) {
      io.to('admin').emit('new_order', {
        order: { ...createdOrder, snap_token: midtransRes.snapToken },
        items: validatedItems
      });
    }

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat.',
      data: {
        order_id: orderId,
        total_amount: grandTotal,
        items_subtotal: itemsSubtotal,
        tax_amount: taxAmount,
        service_amount: serviceAmount,
        snap_token: midtransRes.snapToken,
        redirect_url: midtransRes.redirectUrl,
        is_simulated: midtransRes.isSimulated
      }
    });

  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses pesanan: ' + err.message });
  }
});

// 5. Get Order Details by ID
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const db = await getDb();
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    res.json({
      success: true,
      data: {
        ...order,
        items
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Simulate Payment (Developer/Testing feature for Midtrans Sandbox simulation)
router.post('/orders/:orderId/simulate-payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_type = 'QRIS (Gopay/ShopeePay)', payment_status = 'settlement' } = req.body;
    const db = await getDb();

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const newOrderStatus = payment_status === 'settlement' ? 'paid' : 'failed';
    const midtransTxId = `SIM-TX-${Date.now()}`;

    await db.run(
      `UPDATE orders SET payment_status = ?, status = ?, payment_type = ?, midtrans_transaction_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [payment_status, newOrderStatus, payment_type, midtransTxId, orderId]
    );

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    // Emit socket update to admin & order status room
    const io = req.app.get('socketio');
    if (io) {
      io.to('admin').emit('order_updated', { order: updatedOrder, items });
      io.to(`order_${orderId}`).emit('status_changed', { order: updatedOrder });
    }

    res.json({
      success: true,
      message: `Simulasi pembayaran berhasil! Status pesanan kini: ${newOrderStatus}`,
      data: updatedOrder
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
