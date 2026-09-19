import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '../config/db.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri('printlab3d_test');
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-printlab-3d';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.NODE_ENV = 'test';
  process.env.FRONTEND_URL = 'http://localhost:5500';
  process.env.ADMIN_URL = 'http://localhost:5500/admin.html';
  await connectDB();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});
