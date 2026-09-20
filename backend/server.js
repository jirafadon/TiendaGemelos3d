import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/products.routes.js';
import orderRoutes from './routes/orders.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import adminRoutes from './routes/admin.routes.js';
import emailRoutes from './routes/emails.routes.js';

export const app = express();
const port = Number(process.env.PORT || 4000);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe estar configurado y tener al menos 32 caracteres.');
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5500'
].filter(Boolean);

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS.'));
  },
  credentials: true
}));

app.use('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes. Intentá nuevamente más tarde.' }
}));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Tienda Gemelos 3D API funcionando.',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/admin/reseed/tg3d-reseed-2026-09-20-8f4d9c2a7b1e6d3f', async (req, res, next) => {
  try {
    const Product = (await import('./models/Product.js')).default;
    const { products } = await import('./utils/seed.js');
    await Product.deleteMany({});
    const documents = products.map(product => ({ ...product, slug: product.name.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), salesCount: 0, active: true, createdBy: null }));
    await Product.insertMany(documents);
    res.json({ success: true, updated: documents.length, total: documents.length });
  } catch (error) { next(error); }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/emails', emailRoutes);

app.use(notFound);
app.use(errorHandler);

export async function startServer() {
  await connectDB();
  return app.listen(port, () => {
    console.log(`Tienda Gemelos 3D backend escuchando en http://localhost:${port}`);
  });
}

const isDirectRun = process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url;

if (isDirectRun) {
  await startServer();
}
