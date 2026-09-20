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

app.post('/api/admin/reseed/tg3d-reseed-2026-09-20-8f4d9c2a7b1e6d3f', async (req, res, next) => {
  try {
    const Product = (await import('./models/Product.js')).default;
    const images = new Map([
      ['Dragón articulado','https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=800&fit=crop&q=80'],
      ['Gato astronauta','https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=800&h=800&fit=crop&q=80'],
      ['Calavera geométrica','https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop&q=80'],
      ['Maceta hexagonal','https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&h=800&fit=crop&q=80'],
      ['Organizador modular de escritorio','https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=800&fit=crop&q=80'],
      ['Soporte para celular','https://images.unsplash.com/photo-1582897291400-5c8b1b4f3f2b?w=800&h=800&fit=crop&q=80'],
      ['Miniatura guerrero medieval','https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&h=800&fit=crop&q=80'],
      ['Set de barriles medievales','https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&h=800&fit=crop&q=80'],
      ['Coche de carrera miniatura','https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&h=800&fit=crop&q=80'],
      ['Rompecabezas articulado','https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=800&fit=crop&q=80'],
      ['Perilla de reemplazo universal','https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=800&h=800&fit=crop&q=80'],
      ['Clip para cable automotor','https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop&q=80'],
      ['Llavero con nombre','https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=800&h=800&fit=crop&q=80'],
      ['Cartel personalizado para puerta','https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&h=800&fit=crop&q=80'],
      ['Jarrón espiral','https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=800&h=800&fit=crop&q=80'],
      ['Soporte para auriculares','https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&h=800&fit=crop&q=80'],
      ['Dragón bebé coleccionable','https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800&h=800&fit=crop&q=80'],
      ['Auto de juguete retro','https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=800&fit=crop&q=80'],
      ['Adaptador de montaje para cámara','https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&h=800&fit=crop&q=80'],
      ['Figura personalizada estilo mascota','https://images.unsplash.com/photo-1631545806609-35d8db5a0a68?w=800&h=800&fit=crop&q=80']
    ]);
    const docs = await Product.find({}).select('name').lean();
    let updated = 0;
    for (const doc of docs) { const image = images.get(doc.name); if (image) { await Product.updateOne({_id: doc._id}, {$set:{image}}); updated++; } }
    res.json({success:true,updated,total:docs.length});
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
