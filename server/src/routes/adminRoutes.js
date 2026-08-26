import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';
import { authenticateAdmin, JWT_SECRET } from '../middleware/authMiddleware.js';
import { generateTableQRCode } from '../services/qrService.js';

const router = express.Router();

// 1. Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
    }

    const db = await getDb();
    const admin = await db.get('SELECT * FROM admins WHERE username = ?', [username]);

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role, name: admin.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Verify Token / Profile
router.get('/me', authenticateAdmin, async (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// 3. Get Orders (Real-time dashboard query)
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const db = await getDb();
    
    let query = 'SELECT * FROM orders';
    const params = [];

    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const orders = await db.all(query, params);

    // Attach items to each order
    const ordersWithItems = await Promise.all(
      orders.map(async (o) => {
        const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
        return { ...o, items };
      })
    );

    res.json({ success: true, data: ordersWithItems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Update Order Status
router.patch('/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'paid', 'processing', 'ready', 'completed', 'cancelled'

    const validStatuses = ['pending', 'paid', 'processing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status pesanan tidak valid.' });
    }

    const db = await getDb();
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    await db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [id]);

    // Emit socket event to admin & customer rooms
    const io = req.app.get('socketio');
    if (io) {
      io.to('admin').emit('order_updated', { order: updatedOrder, items });
      io.to(`order_${id}`).emit('status_changed', { order: updatedOrder });
    }

    res.json({ success: true, message: `Status pesanan berhasil diperbarui ke ${status}`, data: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Menu Management (GET, POST, PUT, PATCH availability, DELETE)
router.get('/menu', authenticateAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const items = await db.all('SELECT * FROM menu_items ORDER BY category ASC, name ASC');
    res.json({
      success: true,
      data: items.map(i => ({ ...i, is_available: Boolean(i.is_available) }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/menu', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, price, category, image_url, is_available = true } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: 'Nama, harga, dan kategori menu wajib diisi.' });
    }

    const id = `menu-${Date.now()}`;
    const db = await getDb();
    await db.run(
      `INSERT INTO menu_items (id, name, description, price, category, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description || '', parseFloat(price), category, image_url || '', is_available ? 1 : 0]
    );

    const newItem = await db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
    res.status(201).json({ success: true, message: 'Menu berhasil ditambahkan.', data: { ...newItem, is_available: Boolean(newItem.is_available) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/menu/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_available } = req.body;

    const db = await getDb();
    const item = await db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan.' });
    }

    await db.run(
      `UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, image_url = ?, is_available = ? WHERE id = ?`,
      [
        name ?? item.name,
        description ?? item.description,
        price !== undefined ? parseFloat(price) : item.price,
        category ?? item.category,
        image_url ?? item.image_url,
        is_available !== undefined ? (is_available ? 1 : 0) : item.is_available,
        id
      ]
    );

    const updated = await db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Menu berhasil diperbarui.', data: { ...updated, is_available: Boolean(updated.is_available) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/menu/:id/availability', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    const db = await getDb();
    await db.run('UPDATE menu_items SET is_available = ? WHERE id = ?', [is_available ? 1 : 0, id]);

    res.json({ success: true, message: `Ketersediaan menu berhasil diubah.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/menu/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.run('DELETE FROM menu_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Menu berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Table Management & QR Generation
router.get('/tables', authenticateAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const tables = await db.all('SELECT * FROM tables ORDER BY table_number ASC');
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const hostUrl = `${protocol}://${host}`;

    // Add QR Code Data URLs
    const tablesWithQR = await Promise.all(
      tables.map(async (t) => {
        const qrInfo = await generateTableQRCode(t.table_number, hostUrl);
        return {
          ...t,
          qr_code_data_url: qrInfo.qrDataUrl,
          order_url: qrInfo.orderUrl
        };
      })
    );

    res.json({ success: true, data: tablesWithQR });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/tables', authenticateAdmin, async (req, res) => {
  try {
    const { table_number, capacity = 4 } = req.body;
    if (!table_number) {
      return res.status(400).json({ success: false, message: 'Nomor meja wajib diisi.' });
    }

    const num = parseInt(table_number, 10);
    const db = await getDb();
    
    const existing = await db.get('SELECT * FROM tables WHERE table_number = ?', [num]);
    if (existing) {
      return res.status(400).json({ success: false, message: `Meja Nomor ${num} sudah ada.` });
    }

    const id = `tbl-${num}`;
    const qrUrl = `/order?table=${num}`;
    await db.run(
      'INSERT INTO tables (id, table_number, capacity, qr_code_url, status) VALUES (?, ?, ?, ?, ?)',
      [id, num, capacity, qrUrl, 'available']
    );

    res.status(201).json({ success: true, message: `Meja Nomor ${num} berhasil ditambahkan.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/tables/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.run('DELETE FROM tables WHERE id = ?', [id]);
    res.json({ success: true, message: 'Meja berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Admin Settings & Operational Hours
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all('SELECT key, value FROM settings');
    const settingsObj = {};
    rows.forEach(r => {
      settingsObj[r.key] = r.value;
    });
    res.json({ success: true, data: settingsObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/settings', authenticateAdmin, async (req, res) => {
  try {
    const settings = req.body; // Key-Value pair object
    const db = await getDb();

    for (const [key, value] of Object.entries(settings)) {
      const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await db.run(
        `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?`,
        [key, valStr, valStr]
      );
    }

    res.json({ success: true, message: 'Pengaturan berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Sales Analytics & Reports
router.get('/reports', authenticateAdmin, async (req, res) => {
  try {
    const db = await getDb();
    
    // Overall Metrics
    const totalRevenueRow = await db.get("SELECT SUM(total_amount) as total FROM orders WHERE payment_status = 'settlement'");
    const totalOrdersRow = await db.get("SELECT COUNT(*) as count FROM orders");
    const completedOrdersRow = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'");
    const dineInCountRow = await db.get("SELECT COUNT(*) as count FROM orders WHERE order_type = 'dine_in'");
    const takeawayCountRow = await db.get("SELECT COUNT(*) as count FROM orders WHERE order_type = 'takeaway'");

    // Top Selling Items
    const topItems = await db.all(`
      SELECT item_name, SUM(quantity) as total_qty, SUM(subtotal) as total_revenue
      FROM order_items
      GROUP BY item_name
      ORDER BY total_qty DESC
      LIMIT 5
    `);

    // Recent 7 Days Breakdown
    const dailyStats = await db.all(`
      SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as orders
      FROM orders
      WHERE payment_status = 'settlement'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `);

    res.json({
      success: true,
      data: {
        total_revenue: totalRevenueRow?.total || 0,
        total_orders: totalOrdersRow?.count || 0,
        completed_orders: completedOrdersRow?.count || 0,
        dine_in_count: dineInCountRow?.count || 0,
        takeaway_count: takeawayCountRow?.count || 0,
        top_items: topItems,
        daily_stats: dailyStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
