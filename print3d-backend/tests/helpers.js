import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { signToken } from '../utils/jwt.js';

export async function createTestUser(overrides = {}) {
  const password = overrides.password || 'Test1234!';
  const user = await User.create({
    name: overrides.name || 'Usuario de prueba',
    email: overrides.email || `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: await bcrypt.hash(password, 12),
    provider: 'local',
    role: overrides.role || 'user',
    blocked: false
  });

  return { user, token: signToken(user), password };
}

export async function createTestAdmin(overrides = {}) {
  return createTestUser({
    ...overrides,
    name: overrides.name || 'Administrador de prueba',
    email: overrides.email || `admin-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    role: 'admin'
  });
}

export async function createTestProduct(overrides = {}) {
  return Product.create({
    name: overrides.name || 'Producto demo',
    slug: overrides.slug || `producto-demo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: overrides.description || 'Producto creado para pruebas automatizadas.',
    category: overrides.category || 'figuras',
    price: overrides.price ?? 10000,
    oldPrice: overrides.oldPrice ?? null,
    stock: overrides.stock ?? 10,
    rating: overrides.rating ?? 4.8,
    reviews: overrides.reviews ?? 10,
    seed: overrides.seed || 'producto-demo',
    tags: overrides.tags || ['test'],
    variants: overrides.variants || { color: ['Negro'], size: ['Único'] },
    active: overrides.active ?? true
  });
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
