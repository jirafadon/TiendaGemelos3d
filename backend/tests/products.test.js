import request from 'supertest';
import { describe, expect, test } from '@jest/globals';
import { app } from '../server.js';
import { authHeader, createTestAdmin, createTestProduct, createTestUser } from './helpers.js';

describe('Productos', () => {
  test('GET /api/products → lista con paginación', async () => {
    await createTestProduct({ name: 'Producto 1' });
    await createTestProduct({ name: 'Producto 2' });

    const response = await request(app).get('/api/products?page=1&limit=1');

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.pagination).toMatchObject({ page: 1, limit: 1, total: 2, pages: 2 });
  });

  test('GET /api/products?category=figuras → filtra', async () => {
    await createTestProduct({ category: 'figuras', name: 'Figura' });
    await createTestProduct({ category: 'decoracion', name: 'Decoración' });

    const response = await request(app).get('/api/products?category=figuras');

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].category).toBe('figuras');
  });

  test('GET /api/products/:id → 200 o 404', async () => {
    const product = await createTestProduct();
    const found = await request(app).get(`/api/products/${product._id}`);
    const missing = await request(app).get('/api/products/000000000000000000000000');

    expect(found.status).toBe(200);
    expect(found.body.product._id).toBe(product._id.toString());
    expect(missing.status).toBe(404);
  });

  test('POST /api/products sin token → 401', async () => {
    const response = await request(app).post('/api/products').send({
      name: 'Sin token',
      description: 'Demo',
      category: 'figuras',
      price: 1000,
      stock: 2
    });

    expect(response.status).toBe(401);
  });

  test('POST /api/products con token user → 403', async () => {
    const { token } = await createTestUser();
    const response = await request(app)
      .post('/api/products')
      .set(authHeader(token))
      .send({
        name: 'No autorizado',
        description: 'Demo',
        category: 'figuras',
        price: 1000,
        stock: 2
      });

    expect(response.status).toBe(403);
  });

  test('POST /api/products con token admin → 201', async () => {
    const { token } = await createTestAdmin();
    const response = await request(app)
      .post('/api/products')
      .set(authHeader(token))
      .send({
        name: 'Producto admin',
        description: 'Producto creado por admin.',
        category: 'figuras',
        price: 15000,
        stock: 5
      });

    expect(response.status).toBe(201);
    expect(response.body.product.name).toBe('Producto admin');
  });
});
