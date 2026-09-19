import request from 'supertest';
import { describe, expect, test } from '@jest/globals';
import { app } from '../server.js';
import { createTestUser } from './helpers.js';

describe('Autenticación', () => {
  test('POST /api/auth/register → 201 con token', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Nuevo Usuario',
      email: 'nuevo@example.com',
      password: 'Password123!'
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe('nuevo@example.com');
  });

  test('POST /api/auth/register → 409 si email duplicado', async () => {
    await createTestUser({ email: 'duplicado@example.com' });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Duplicado',
      email: 'duplicado@example.com',
      password: 'Password123!'
    });

    expect(response.status).toBe(409);
  });

  test('POST /api/auth/login → 200 con credenciales válidas', async () => {
    await createTestUser({ email: 'login@example.com', password: 'Password123!' });

    const response = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toEqual(expect.any(String));
  });

  test('POST /api/auth/login → 401 con credenciales inválidas', async () => {
    await createTestUser({ email: 'invalid@example.com', password: 'Password123!' });

    const response = await request(app).post('/api/auth/login').send({
      email: 'invalid@example.com',
      password: 'WrongPassword123!'
    });

    expect(response.status).toBe(401);
  });

  test('GET /api/auth/me → 200 con token, 401 sin token', async () => {
    const { token } = await createTestUser({ email: 'me@example.com' });

    const authenticated = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    const unauthenticated = await request(app).get('/api/auth/me');

    expect(authenticated.status).toBe(200);
    expect(authenticated.body.user.email).toBe('me@example.com');
    expect(unauthenticated.status).toBe(401);
  });

  test('POST /api/auth/forgot-password → 200 siempre', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'no-existe@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
