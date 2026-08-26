import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import alasql from 'alasql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running on Vercel
const isVercel = process.env.VERCEL || process.env.NOW_REGION;

let dbInstance = null;
let isAlaSqlInitialized = false;

export async function getDb() {
  if (dbInstance) return dbInstance;

  if (isVercel) {
    console.log('Using AlaSQL (In-Memory) for Vercel Serverless');
    const alaDb = new alasql.Database();
    
    // Create a wrapper that matches the 'sqlite' module API
    dbInstance = {
      all: async (sql, params = []) => alaDb.exec(sql.replace(/AUTOINCREMENT/gi, ''), params),
      get: async (sql, params = []) => { 
        const r = alaDb.exec(sql.replace(/AUTOINCREMENT/gi, ''), params); 
        return r && r.length > 0 ? r[0] : undefined; 
      },
      run: async (sql, params = []) => { 
        alaDb.exec(sql.replace(/AUTOINCREMENT/gi, ''), params); 
        return { changes: 1 }; 
      },
      exec: async (sql) => {
        // AlaSQL doesn't like multiple statements in one exec well, but it works for basic creates
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        for(let s of statements) {
          alaDb.exec(s.replace(/AUTOINCREMENT/gi, ''));
        }
      }
    };
    return dbInstance;
  }

  // Use real SQLite3 locally
  const sqlite3 = (await import('sqlite3')).default;
  const { open } = await import('sqlite');
  
  const dbPath = path.join(__dirname, '../../cafeorder.db');
  
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await dbInstance.run('PRAGMA foreign_keys = ON');
  return dbInstance;
}

export async function initDb() {
  const db = await getDb();
  if (isVercel && isAlaSqlInitialized) return; // Prevent re-init on warm serverless calls

  console.log('Initializing database schema...');

  // 1. Tables (Meja)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id STRING PRIMARY KEY,
      table_number INT UNIQUE,
      capacity INT,
      qr_code_url STRING,
      status STRING,
      created_at STRING
    );
  `);

  // 2. Menu Categories & Menu Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id STRING PRIMARY KEY,
      name STRING,
      description STRING,
      price REAL,
      category STRING,
      image_url STRING,
      is_available INT,
      created_at STRING
    );
  `);

  // 3. Orders & Order Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id STRING PRIMARY KEY,
      table_number INT,
      customer_name STRING,
      order_type STRING,
      status STRING,
      payment_status STRING,
      payment_method STRING,
      total_amount REAL,
      snap_token STRING,
      created_at STRING,
      updated_at STRING
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id STRING PRIMARY KEY,
      order_id STRING,
      menu_item_id STRING,
      menu_item_name STRING,
      quantity INT,
      price REAL,
      subtotal REAL,
      notes STRING
    );
  `);

  // 4. Admin Users
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id STRING PRIMARY KEY,
      username STRING UNIQUE,
      password_hash STRING,
      name STRING,
      role STRING,
      created_at STRING
    );
  `);

  // 5. Settings
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key STRING PRIMARY KEY,
      value STRING
    );
  `);

  // Seed default admin if not exists
  const adminCount = await db.get('SELECT COUNT(*) as count FROM admins');
  if (adminCount.count === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await db.run(
      \`INSERT INTO admins (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)\`,
      ['adm_1', 'admin', passwordHash, 'Super Admin', 'admin']
    );
    const userHash = await bcrypt.hash('user123', 10);
    await db.run(
      \`INSERT INTO admins (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)\`,
      ['adm_2', 'user', userHash, 'Kasir Utama', 'kasir']
    );
    console.log('Default admins seeded.');
  }

  // Seed default tables if empty
  const tableCount = await db.get('SELECT COUNT(*) as count FROM tables');
  if (tableCount.count === 0) {
    for (let i = 1; i <= 10; i++) {
      await db.run(
        \`INSERT INTO tables (id, table_number, capacity, status) VALUES (?, ?, ?, ?)\`,
        [\`tbl_\${i}\`, i, 4, 'available']
      );
    }
    console.log('Seeded 10 cafe tables.');
  }

  // Seed Menu
  const menuCount = await db.get('SELECT COUNT(*) as count FROM menu_items');
  if (menuCount.count === 0) {
    const defaultMenu = [
      { id: 'm1', name: 'Nasi Goreng Spesial', price: 25000, category: 'Makanan', desc: 'Nasi goreng dengan telur, ayam, dan kerupuk.' },
      { id: 'm2', name: 'Mie Goreng Seafood', price: 28000, category: 'Makanan', desc: 'Mie goreng dengan udang dan cumi segar.' },
      { id: 'm3', name: 'Kopi Susu Gula Aren', price: 18000, category: 'Minuman', desc: 'Es kopi susu blend dengan gula aren asli.' },
      { id: 'm4', name: 'Lemon Tea', price: 15000, category: 'Minuman', desc: 'Teh lemon segar manis merona.' },
      { id: 'm5', name: 'Kentang Goreng', price: 15000, category: 'Snack', desc: 'Kentang goreng renyah bumbu BBQ.' }
    ];
    for (const m of defaultMenu) {
      await db.run(
        \`INSERT INTO menu_items (id, name, description, price, category) VALUES (?, ?, ?, ?, ?)\`,
        [m.id, m.name, m.desc, m.price, m.category]
      );
    }
    console.log('Seeded initial menu items.');
  }

  // Seed Settings
  const settingsCount = await db.get('SELECT COUNT(*) as count FROM settings');
  if (settingsCount.count === 0) {
    const defaultSettings = [
      { key: 'cafe_name', value: 'CafeOrder Digital' },
      { key: 'tax_rate', value: '11' },
      { key: 'service_fee', value: '5' },
      { key: 'operational_hours', value: JSON.stringify([
        { day: 1, open: "08:00", close: "22:00", is_active: true },
        { day: 2, open: "08:00", close: "22:00", is_active: true },
        { day: 3, open: "08:00", close: "22:00", is_active: true },
        { day: 4, open: "08:00", close: "22:00", is_active: true },
        { day: 5, open: "08:00", close: "23:00", is_active: true },
        { day: 6, open: "08:00", close: "23:00", is_active: true },
        { day: 0, open: "08:00", close: "23:00", is_active: true }
      ])}
    ];
    for (const s of defaultSettings) {
      await db.run(\`INSERT INTO settings (key, value) VALUES (?, ?)\`, [s.key, s.value]);
    }
    console.log('Seeded default settings.');
  }

  isAlaSqlInitialized = true;
  console.log('Database initialization completed.');
}
