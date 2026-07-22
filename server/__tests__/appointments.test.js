import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { connectTestDB, disconnectTestDB, clearCollections } from './helpers/db.js'
import { createTestApp } from './helpers/testApp.js'
import User from '../models/User.js'

const app = createTestApp()

async function seedDoctor() {
  return User.create({
    fullName:       'Dr. Test Okafor',
    email:          'doctor@test.com',
    password:       'Doctor@123',
    role:           'doctor',
    specialization: 'General Practice',
    hospital:       'UBTH',
    isActive:       true,
    isVerified:     true,
  })
}

async function registerAndLoginPatient() {
  const res = await request(app).post('/api/auth/register').send({
    fullName: 'Test Patient',
    email:    'patient@test.com',
    password: 'Password@123',
    role:     'patient',
    phone:    '+2348012345678',
    state:    'Edo',
    lga:      'Oredo',
  })
  return { token: res.body.token, userId: res.body.user._id }
}

beforeAll(async () => { await connectTestDB() })
afterAll(async  () => { await disconnectTestDB() })
beforeEach(async () => { await clearCollections() })

describe('GET /api/patient/appointments', () => {
  it('returns empty list for new patient', async () => {
    const { token } = await registerAndLoginPatient()
    const res = await request(app)
      .get('/api/patient/appointments')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.appointments)).toBe(true)
    expect(res.body.appointments.length).toBe(0)
  })

  it('blocks unauthenticated access', async () => {
    const res = await request(app).get('/api/patient/appointments')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/patient/appointments (book)', () => {
  it('books an appointment with a valid doctor', async () => {
    const doctor = await seedDoctor()
    const { token } = await registerAndLoginPatient()

    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    const res = await request(app)
      .post('/api/patient/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctorId:          doctor._id.toString(),
        date:              tomorrow,
        timeSlot:          '10:00',
        consultationType:  'video',
        symptoms:          'Headache and fever',
      })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.appointment.status).toBe('pending')
    expect(res.body.appointment.consultationType).toBe('video')
  })

  it('rejects booking without required fields', async () => {
    const { token } = await registerAndLoginPatient()
    const res = await request(app)
      .post('/api/patient/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ consultationType: 'video' })
    expect(res.status).toBe(400)
  })

  it('lists the booked appointment', async () => {
    const doctor = await seedDoctor()
    const { token } = await registerAndLoginPatient()
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

    await request(app)
      .post('/api/patient/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctorId:         doctor._id.toString(),
        date:             tomorrow,
        timeSlot:         '10:00',
        consultationType: 'phone',
        symptoms:         'Cough',
      })

    const res = await request(app)
      .get('/api/patient/appointments')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.appointments.length).toBe(1)
    expect(res.body.appointments[0].consultationType).toBe('phone')
  })

  it('prevents booking on a past date', async () => {
    const doctor = await seedDoctor()
    const { token } = await registerAndLoginPatient()
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    const res = await request(app)
      .post('/api/patient/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctorId:         doctor._id.toString(),
        date:             yesterday,
        timeSlot:         '10:00',
        consultationType: 'video',
      })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/patient/appointments/:id (cancel)', () => {
  it('cancels a pending appointment', async () => {
    const doctor = await seedDoctor()
    const { token } = await registerAndLoginPatient()
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

    const book = await request(app)
      .post('/api/patient/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctorId: doctor._id.toString(), date: tomorrow,
        timeSlot: '09:00', consultationType: 'video',
      })
    const apptId = book.body.appointment._id

    const res = await request(app)
      .delete(`/api/patient/appointments/${apptId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
