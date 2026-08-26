import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'cafeorder.db');

async function addUser() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  const passwordHash = await bcrypt.hash('user123', 10);
  
  try {
    await db.run(
      `INSERT INTO admins (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`,
      ['adm_2', 'user', passwordHash, 'Staf Kasir', 'kasir']
    );
    console.log('Kasir user added successfully.');
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      console.log('User already exists.');
    } else {
      console.error(err);
    }
  }
}

addUser();
