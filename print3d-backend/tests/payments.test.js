import request from 'supertest';
import { describe, expect, jest, test } from '@jest/globals';
import Order from '../models/Order.js';
import { app } from '../server.js';
import { authHeader, createTestProduct, createTestUser } from './helpers.js';

describe('Pagos y checkout', () => {
  test('POST /api/payments/checkout con carrito vacío → 400', async () => {
    const { token } = await createTestUser({ email: 'empty-cart@example.com' });

    const response = await request(app)
      .post('/api/payments/checkout')
      .set(authHeader(token))
      .send({
        items: [],
        customer: {
          name: 'Usuario',
          email: 'empty-cart@example.com',
          address: 'Calle Test 123',
          city: 'Buenos Aires',
          zip: '1000'
        },
        payMethod: 'transfer'
      });

    expect(response.status).toBe(400);
  });

  test('POST /api/payments/checkout con datos válidos y payMethod=transfer → 201 con número de orden', async () => {
    const { user, token } = await createTestUser({ email: 'checkout@example.com' });
    const product = await createTestProduct({ stock: 5, price: 12000 });

    const response = await request(app)
      .post('/api/payments/checkout')
      .set(authHeader(token))
      .send({
        items: [{ productId: product._id.toString(), qty: 1, variant: { color: 'Negro' } }],
        customer: {
          name: user.name,
          email: user.email,
          phone: '1122334455',
          address: 'Calle Test 123',
          city: 'Buenos Aires',
          zip: '1000'
        },
        payMethod: 'transfer'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.order.number).toMatch(/^PL3D-/);
    expect(response.body.payment.method).toBe('transfer');

    const savedOrder = await Order.findById(response.body.order._id);
    expect(savedOrder).not.toBeNull();
    expect(savedOrder.payStatus).toBe('pending');
  });
});
