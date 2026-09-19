import { app } from '../backend/server.js';
import { connectDB } from '../backend/config/db.js';

let dbPromise;

export default async function handler(req, res) {
  if (!dbPromise) dbPromise = connectDB();
  await dbPromise;
  return app(req, res);
}