import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { connectTestDB, disconnectTestDB, clearCollections } from './helpers/db.js'
import { createTestApp } from './helpers/testApp.js'

const app = createTestApp()

const patient = {
  fullName: 'Test Patient',
  email:    'testpatient@test.com',
  password: 'Password@123',
  role:     'patient',
  phone:    '+2348012345678',
  state:    'Lagos',
  lga:      'Ikeja',
}

beforeAll(async () => { await connectTestDB() })
afterAll(async  () => { await disconnectTestDB() })
beforeEach(async () => { await clearCollections() })

describe('POST /api/auth/register', () => {
  it('registers a new patient and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(patient)
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.email).toBe(patient.email)
    expect(res.body.user.role).toBe('patient')
    expect(res.body.user.password).toBeUndefined()
  })

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(patient)
    const res = await request(app).post('/api/auth/register').send(patient)
    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  it('rejects registration with missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('does not allow direct admin registration', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...patient, role: 'admin' })
    // Either rejected or role is forced to patient
    if (res.status === 201) {
      expect(res.body.user.role).not.toBe('admin')
    } else {
      expect(res.status).toBe(400)
    }
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(patient)
  })

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: patient.email, password: patient.password,
    })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.email).toBe(patient.email)
  })

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: patient.email, password: 'wrongpassword',
    })
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('rejects non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com', password: 'Password@123',
    })
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns password-free user object', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: patient.email, password: patient.password,
    })
    expect(res.body.user.password).toBeUndefined()
  })
})

describe('GET /api/auth/me', () => {
  let token

  beforeEach(async () => {
    const reg = await request(app).post('/api/auth/register').send(patient)
    token = reg.body.token
  })

  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(patient.email)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken')
    expect(res.status).toBe(401)
  })
})
