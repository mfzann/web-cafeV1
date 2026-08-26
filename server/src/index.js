import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initDb } from './config/database.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5055;

// CORS setup for frontend local dev & production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Socket.IO for real-time order updates
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('Client connected to Socket.IO:', socket.id);

  socket.on('join_admin', () => {
    socket.join('admin');
    console.log(`Socket ${socket.id} joined admin room`);
  });

  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined room for order: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve Static files / Uploads if any
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Register API Routes
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Root health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CafeOrder API Server Running' });
});

// Initialize DB and Start Server
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`☕ CafeOrder Server running on http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
});
