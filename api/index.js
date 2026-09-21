import { app } from '../backend/server.js';
import { connectDB } from '../backend/config/db.js';
import { seedCategories } from '../backend/utils/seedCategories.js';

let dbPromise;

export default async function handler(req, res) {
  if (!dbPromise) dbPromise = connectDB();
  await dbPromise;
  await seedCategories();
  return app(req, res);
}