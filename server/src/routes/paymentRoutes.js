import express from 'express';
import { getDb } from '../config/database.js';
import { verifyMidtransSignature } from '../services/midtransService.js';

const router = express.Router();

// Midtrans Notification Webhook Endpoint
router.post('/notification', async (req, res) => {
  try {
    const notification = req.body;
    console.log('Received Midtrans Notification:', notification);

    const isValid = await verifyMidtransSignature(notification);
    if (!isValid) {
      console.warn('Invalid Midtrans Signature!');
      return res.status(403).json({ success: false, message: 'Signature verification failed' });
    }

    const { order_id, transaction_status, payment_type, transaction_id } = notification;

    const db = await getDb();
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [order_id]);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let paymentStatus = 'pending';
    let orderStatus = order.status;

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      paymentStatus = 'settlement';
      orderStatus = 'paid';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending';
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'expire' ||
      transaction_status === 'cancel'
    ) {
      paymentStatus = 'failed';
      orderStatus = 'cancelled';
    }

    await db.run(
      `UPDATE orders SET payment_status = ?, status = ?, payment_type = ?, midtrans_transaction_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [paymentStatus, orderStatus, payment_type || 'online', transaction_id || '', order_id]
    );

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [order_id]);
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order_id]);

    // Notify connected Socket.IO clients (Admin Dashboard & Customer Confirmation page)
    const io = req.app.get('socketio');
    if (io) {
      io.to('admin').emit('order_updated', { order: updatedOrder, items });
      io.to(`order_${order_id}`).emit('status_changed', { order: updatedOrder });
    }

    res.json({ success: true, message: 'Notification processed successfully' });
  } catch (err) {
    console.error('Error handling Midtrans webhook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
