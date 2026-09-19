import request from 'supertest';
import { describe, expect, test } from '@jest/globals';
import Order from '../models/Order.js';
import { app } from '../server.js';
import { authHeader, createTestProduct, createTestUser } from './helpers.js';

describe('Pedidos', () => {
  test('GET /api/orders → 401 sin token', async () => {
    const response = await request(app).get('/api/orders');
    expect(response.status).toBe(401);
  });

  test('GET /api/orders → 200 con pedidos del usuario', async () => {
    const { user, token } = await createTestUser({ email: 'orders@example.com' });
    const product = await createTestProduct();

    await Order.create({
      number: 'PL3D-TEST-0001',
      user: user._id,
      items: [{ productId: product._id, name: product.name, price: product.price, qty: 1 }],
      subtotal: product.price,
      shipping: 0,
      discount: 0,
      total: product.price,
      payMethod: 'transfer',
      customer: {
        name: user.name,
        email: user.email,
        address: 'Calle Test 123',
        city: 'Buenos Aires',
        zip: '1000'
      },
      statusHistory: [{ status: 'pending', note: 'Test' }]
    });

    const response = await request(app)
      .get('/api/orders')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0].number).toBe('PL3D-TEST-0001');
  });

  test('GET /api/orders/:id → 403 si no es dueño', async () => {
    const owner = await createTestUser({ email: 'owner@example.com' });
    const other = await createTestUser({ email: 'other@example.com' });
    const product = await createTestProduct();

    const order = await Order.create({
      number: 'PL3D-TEST-0002',
      user: owner.user._id,
      items: [{ productId: product._id, name: product.name, price: product.price, qty: 1 }],
      subtotal: product.price,
      shipping: 0,
      discount: 0,
      total: product.price,
      payMethod: 'transfer',
      customer: {
        name: owner.user.name,
        email: owner.user.email,
        address: 'Calle Test 123',
        city: 'Buenos Aires',
        zip: '1000'
      },
      statusHistory: [{ status: 'pending', note: 'Test' }]
    });

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set(authHeader(other.token));

    expect([403, 404]).toContain(response.status);
  });
});
