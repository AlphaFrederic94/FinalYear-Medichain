process.env.DATABASE_URL = 'postgresql://postgres:afrihealth_pass@localhost:5433/auth_db_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';
process.env.NODE_ENV = 'test';
process.env.PORT = '3099';
process.env.SERVICE_NAME = 'auth-service';
process.env.INTERNAL_SERVICE_SECRET = 'test-internal-secret';

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const app = require('../../src/index');
const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
  await prisma.loginHistory.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.loginHistory.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe('POST /auth/register/patient', () => {
  test('registers patient and returns 201 with tokens', async () => {
    const res = await request(app).post('/auth/register/patient').send({
      firstName: 'Alice',
      lastName: 'Kamga',
      email: 'alice@test.com',
      password: 'securepass123',
      countryCode: 'CMR',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.did).toMatch(/^did:afrihealth:CMR-/);
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('returns 409 if email already used', async () => {
    const res = await request(app).post('/auth/register/patient').send({
      firstName: 'Alice',
      lastName: 'Kamga',
      email: 'alice@test.com',
      password: 'securepass123',
      countryCode: 'CMR',
    });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_EXISTS');
  });

  test('returns 400 on invalid input', async () => {
    const res = await request(app).post('/auth/register/patient').send({
      email: 'not-an-email',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /auth/login', () => {
  test('logs in and returns access + refresh tokens', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'alice@test.com',
      password: 'securepass123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('alice@test.com');
  });

  test('returns 401 for wrong password', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'alice@test.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('returns 401 for unknown email', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'nobody@test.com',
      password: 'securepass123',
    });

    expect(res.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  let accessToken;

  beforeAll(async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'alice@test.com',
      password: 'securepass123',
    });
    accessToken = res.body.data.accessToken;
  });

  test('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('alice@test.com');
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/token/refresh', () => {
  let refreshToken;

  beforeAll(async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'alice@test.com',
      password: 'securepass123',
    });
    refreshToken = res.body.data.refreshToken;
  });

  test('returns new tokens for valid refresh token', async () => {
    const res = await request(app).post('/auth/token/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('returns 401 for invalid refresh token', async () => {
    const res = await request(app)
      .post('/auth/token/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  test('returns service health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBeLessThan(600);
    expect(res.body.service).toBe('auth-service');
  });
});
