import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../cafeorder.db');

export async function getDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  return db;
}

export async function initDb() {
  const db = await getDb();

  console.log('Initializing SQLite database schema...');

  // 1. Tables (Meja)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      table_number INTEGER UNIQUE NOT NULL,
      capacity INTEGER DEFAULT 4,
      qr_code_url TEXT,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Menu Categories & Menu Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Orders
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      table_id TEXT,
      table_number INTEGER,
      order_type TEXT NOT NULL DEFAULT 'dine_in',
      status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_type TEXT,
      total_amount REAL NOT NULL,
      customer_name TEXT,
      notes TEXT,
      snap_token TEXT,
      midtrans_transaction_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Order Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      menu_item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      note TEXT,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // 5. Admins
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Settings (Key-Value)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default Admin if not exists
  const adminCount = await db.get('SELECT COUNT(*) as count FROM admins');
  if (adminCount.count === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await db.run(
      `INSERT INTO admins (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`,
      ['adm_1', 'admin', passwordHash, 'Head Staff / Kasir', 'admin']
    );
    console.log('Default admin seeded: username=admin, password=admin123');
  }

  // Seed default Tables if empty
  const tableCount = await db.get('SELECT COUNT(*) as count FROM tables');
  if (tableCount.count === 0) {
    const seedTables = [
      { id: 'tbl-1', number: 1, capacity: 2 },
      { id: 'tbl-2', number: 2, capacity: 4 },
      { id: 'tbl-3', number: 3, capacity: 4 },
      { id: 'tbl-4', number: 4, capacity: 6 },
      { id: 'tbl-5', number: 5, capacity: 2 },
      { id: 'tbl-6', number: 6, capacity: 8 },
      { id: 'tbl-7', number: 7, capacity: 4 },
      { id: 'tbl-8', number: 8, capacity: 4 },
      { id: 'tbl-9', number: 9, capacity: 2 },
      { id: 'tbl-10', number: 10, capacity: 6 }
    ];
    for (const t of seedTables) {
      await db.run(
        `INSERT INTO tables (id, table_number, capacity, qr_code_url, status) VALUES (?, ?, ?, ?, ?)`,
        [t.id, t.number, t.capacity, `/order?table=${t.number}`, 'available']
      );
    }
    console.log('Seeded 10 cafe tables.');
  }

  // Seed default Menu Items if empty
  const menuCount = await db.get('SELECT COUNT(*) as count FROM menu_items');
  if (menuCount.count === 0) {
    const seedMenu = [
      // Makanan Berat
      {
        id: 'menu-1',
        name: 'Nasi Goreng Special Rempah',
        description: 'Nasi goreng racikan rempah khas cafe disajikan dengan telur mata sapi, sate ayam, dan kerupuk renyah.',
        price: 35000,
        category: 'Makanan Berat',
        image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      },
      {
        id: 'menu-2',
        name: 'Spaghetti Carbonara Creamy',
        description: 'Pastanya lembut dengan saus krim gurih, keju parmesan impor, dan taburan beef bacon gurih.',
        price: 42000,
        category: 'Makanan Berat',
        image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      },
      {
        id: 'menu-3',
        name: 'Chicken Steak Sauce Blackpepper',
        description: 'Dada ayam grill juicy dipadu saus lada hitam pedas gurih, disajikan dengan kentang goreng dan tumis sayur.',
        price: 48000,
        category: 'Makanan Berat',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      },
      {
        id: 'menu-4',
        name: 'Beef Wagyu Burger Deluxe',
        description: 'Patty sapi wagyu lembut 150g dengan keju cheddar leleh, caramelized onion, dan saus rahasia cafe.',
        price: 55000,
        category: 'Makanan Berat',
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      },

      // Minuman
      {
        id: 'menu-5',
        name: 'Kopi Susu Aren Signature',
        description: 'Espresso blend Arabica-Robusta dengan susu segar dan sirup gula aren murni khas nusantara.',
        price: 24000,
        category: 'Minuman',
        image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      },
      {
        id: 'menu-6',
        name: 'Iced Matcha Oat Latte',
        description: 'Matcha Uji Jepang premium dipadu dengan susu oat gurih dingin yang menyegarkan.',
        price: 28000,
        category: 'Minuman',
        image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      },
      {
        id: 'menu-7',
        name: 'Berry Sparkling Lemonade',
        description: 'Perasan jeruk lemon segar, sirup rasberi, dan air soda dingin dengan hiasan daun mint segar.',
        price: 26000,
        category: 'Minuman',
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      },
      {
        id: 'menu-8',
        name: 'Classic Hot Cappuccino',
        description: 'Double shot espresso dengan susu creamy hangat dan foam tebal bertabur bubuk cokelat.',
        price: 25000,
        category: 'Minuman',
        image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      },

      // Snack
      {
        id: 'menu-9',
        name: 'Truffle French Fries',
        description: 'Kentang goreng garing ditaburi minyak truffle aromatik dan keju parmesan parut.',
        price: 28000,
        category: 'Snack',
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      },
      {
        id: 'menu-10',
        name: 'Crispy Chicken Wings BBQ',
        description: '6 potong sayap ayam renyah dilumuri saus BBQ smoky pedas manis khas chef.',
        price: 32000,
        category: 'Snack',
        image_url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      },

      // Dessert
      {
        id: 'menu-11',
        name: 'Classic Basque Burnt Cheesecake',
        description: 'Cheesecake panggang bertekstur creamy di dalam dengan permukaan terkaramelisasi harum.',
        price: 32000,
        category: 'Dessert',
        image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      },
      {
        id: 'menu-12',
        name: 'Matcha Lava Cake & Ice Cream',
        description: 'Kue hangat dengan lelehan matcha manis gurih di dalamnya, disajikan bersama 1 scoop es krim vanila.',
        price: 34000,
        category: 'Dessert',
        image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
        is_available: 1
      }
    ];

    for (const item of seedMenu) {
      await db.run(
        `INSERT INTO menu_items (id, name, description, price, category, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.name, item.description, item.price, item.category, item.image_url, item.is_available]
      );
    }
    console.log('Seeded initial menu items.');
  }

  // Seed default Settings
  const defaultSettings = [
    { key: 'cafe_name', value: 'CafeOrder Bistro & Brew' },
    { key: 'cafe_address', value: 'Jl. Riau No. 45, Bandung, Jawa Barat' },
    { key: 'tax_rate', value: '10' }, // 10%
    { key: 'service_fee', value: '5' }, // 5%
    { key: 'default_theme', value: 'warm' }, // 'light', 'dark', 'warm'
    { key: 'midtrans_client_key', value: 'SB-Mid-client-DEMOKEY123' },
    { key: 'midtrans_server_key', value: 'SB-Mid-server-DEMOKEY123' },
    { key: 'midtrans_is_production', value: 'false' },
    { key: 'midtrans_enable_simulation', value: 'true' }, // Allow instant payment testing button
    {
      key: 'operational_hours',
      value: JSON.stringify([
        { day: 0, day_name: 'Minggu', open: '08:00', close: '22:00', is_active: true },
        { day: 1, day_name: 'Senin', open: '08:00', close: '22:00', is_active: true },
        { day: 2, day_name: 'Selasa', open: '08:00', close: '22:00', is_active: true },
        { day: 3, day_name: 'Rabu', open: '08:00', close: '22:00', is_active: true },
        { day: 4, day_name: 'Kamis', open: '08:00', close: '22:00', is_active: true },
        { day: 5, day_name: 'Jumat', open: '08:00', close: '23:00', is_active: true },
        { day: 6, day_name: 'Sabtu', open: '08:00', close: '23:00', is_active: true }
      ])
    }
  ];

  for (const s of defaultSettings) {
    await db.run(
      `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
      [s.key, s.value]
    );
  }

  console.log('Database initialization completed.');
}
