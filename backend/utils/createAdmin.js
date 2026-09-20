import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();
const email = process.env.SEED_ADMIN_EMAIL || 'admin@tiendagemelos3d.com';
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME || 'Admin';

async function createAdmin() {
  if (!password) throw new Error('SEED_ADMIN_PASSWORD es obligatoria.');
  await connectDB();
  const hash = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { $set: { name, email: email.toLowerCase(), password: hash, role: 'admin', provider: 'local', blocked: false } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  console.log('Administrador creado/actualizado correctamente.');
  console.log('Email: ' + user.email);
  console.log('Password: ' + password);
  await mongoose.disconnect();
}

createAdmin().catch(async (error) => { console.error('No se pudo crear el administrador:', error.message); await mongoose.disconnect().catch(() => {}); process.exitCode = 1; });
