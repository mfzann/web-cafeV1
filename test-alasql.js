import { getDb, initDb } from './server/src/config/database.js';

process.env.VERCEL = '1';

async function test() {
  await initDb();
  const db = await getDb();
  
  const admin = await db.get('SELECT * FROM admins WHERE username = ?', ['admin']);
  console.log('Admin:', admin);
  
  if (admin) {
    console.log('Login success!');
  } else {
    console.log('Admin not found!');
  }
}

test();
