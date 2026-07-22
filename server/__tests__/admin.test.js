import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { connectTestDB, disconnectTestDB, clearCollections } from './helpers/db.js'
import { createTestApp } from './helpers/testApp.js'
import User from '../models/User.js'

const app = createTestApp()

async function createAdmin() {
  return User.create({
    fullName: 'System Admin',
    email:    'admin@mediconnect.com',
    password: 'Admin@12345',
    role:     'admin',
    isActive: true,
  })
}

async function loginAdmin() {
  const res = await request(app).post('/api/auth/login').send({
    email: 'admin@mediconnect.com', password: 'Admin@12345',
  })
  return res.body.token
}

async function registerPatient() {
  const res = await request(app).post('/api/auth/register').send({
    fullName: 'Test Patient',
    email:    'patient@test.com',
    password: 'Password@123',
    role:     'patient',
    phone:    '+2348012345678',
    state:    'Edo',
    lga:      'Oredo',
  })
  return res.body.token
}

beforeAll(async () => { await connectTestDB() })
afterAll(async  () => { await disconnectTestDB() })
beforeEach(async () => { await clearCollections(); await createAdmin() })

describe('GET /api/admin/stats', () => {
  it('returns platform overview stats for admin', async () => {
    const token = await loginAdmin()
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.stats).toHaveProperty('totalPatients')
    expect(res.body.stats).toHaveProperty('totalDoctors')
    expect(res.body.stats).toHaveProperty('verifiedDoctors')
  })

  it('blocks unauthenticated access', async () => {
    const res = await request(app).get('/api/admin/stats')
    expect(res.status).toBe(401)
  })

  it('blocks patient access', async () => {
    const token = await registerPatient()
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin/patients', () => {
  it('returns patient list', async () => {
    await registerPatient()
    const token = await loginAdmin()
    const res = await request(app)
      .get('/api/admin/patients')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.patients)).toBe(true)
    expect(res.body.patients.length).toBeGreaterThan(0)
    // Passwords must not be returned
    res.body.patients.forEach(p => expect(p.password).toBeUndefined())
  })

  it('supports search by name', async () => {
    await registerPatient()
    const token = await loginAdmin()
    const res = await request(app)
      .get('/api/admin/patients?search=Test')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.patients.length).toBeGreaterThan(0)
  })
})

describe('GET /api/admin/doctors', () => {
  it('returns empty doctor list initially', async () => {
    const token = await loginAdmin()
    const res = await request(app)
      .get('/api/admin/doctors')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.doctors)).toBe(true)
  })

  it('registers a new doctor via admin endpoint', async () => {
    const token = await loginAdmin()
    const res = await request(app)
      .post('/api/admin/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName:       'Dr. Test Doctor',
        email:          'doctor@test.com',
        password:       'Doctor@123',
        specialization: 'Cardiology',
        hospital:       'UBTH, Benin',
        phone:          '+2348098765432',
        state:          'Edo',
        lga:            'Egor',
      })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.doctor.role).toBe('doctor')
    expect(res.body.doctor.password).toBeUndefined()
  })
})

describe('GET /api/admin/appointments', () => {
  it('returns appointments list', async () => {
    const token = await loginAdmin()
    const res = await request(app)
      .get('/api/admin/appointments')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.appointments)).toBe(true)
  })

  it('filters by status', async () => {
    const token = await loginAdmin()
    const res = await request(app)
      .get('/api/admin/appointments?status=confirmed')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    res.body.appointments.forEach(a => expect(a.status).toBe('confirmed'))
  })
})
