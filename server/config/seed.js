import User            from '../models/User.js'
import AuditLog         from '../models/AuditLog.js'
import MedicalRecord    from '../models/MedicalRecord.js'
import AccessGrant      from '../models/AccessGrant.js'
import { createDemoFiles } from './createDemoFiles.js'

const DEMO_DOCTORS = [
  { fullName: 'Dr. Adaeze Nwosu',   email: 'adaeze@luth.com',  password: 'Doctor@123', specialization: 'Cardiology',       hospital: 'LUTH, Lagos',     licenseNumber: 'MDC-2019-045' },
  { fullName: 'Dr. Emeka Okafor',   email: 'emeka@uch.com',    password: 'Doctor@123', specialization: 'General Practice', hospital: 'UCH, Ibadan',     licenseNumber: 'MDC-2018-112' },
  { fullName: 'Dr. Fatima Bello',   email: 'fatima@abuth.com', password: 'Doctor@123', specialization: 'Paediatrics',      hospital: 'ABUTH, Zaria',    licenseNumber: 'MDC-2020-078' },
  { fullName: 'Dr. Chukwuma Eze',   email: 'chukwuma@unth.com',password: 'Doctor@123', specialization: 'Radiology',        hospital: 'UNTH, Enugu',     licenseNumber: 'MDC-2017-033' },
  { fullName: 'Dr. Ngozi Ibrahim',  email: 'ngozi@isth.com',   password: 'Doctor@123', specialization: 'Gynaecology',      hospital: 'ISTH, Irrua',     licenseNumber: 'MDC-2021-091' },
]

const DEMO_PATIENTS = [
  { fullName: 'Tunde Bakare',    email: 'tunde@email.com',    password: 'Patient@123', phone: '+2348031234567', dateOfBirth: new Date('1990-05-14'), state: 'Edo State', lga: 'Igueben' },
  { fullName: 'Amaka Okonkwo',   email: 'amaka@email.com',    password: 'Patient@123', phone: '+2348041234567', dateOfBirth: new Date('1985-11-02'), state: 'Edo State', lga: 'Esan West' },
  { fullName: 'Musa Abdullahi',  email: 'musa@email.com',     password: 'Patient@123', phone: '+2348051234567', dateOfBirth: new Date('1993-07-20'), state: 'Edo State', lga: 'Etsako East' },
  { fullName: 'Blessing Eze',    email: 'blessing@email.com', password: 'Patient@123', phone: '+2348061234567', dateOfBirth: new Date('1998-03-08'), state: 'Edo State', lga: 'Orhionmwon' },
  { fullName: 'Kehinde Adeyemi', email: 'kehinde@email.com',  password: 'Patient@123', phone: '+2348071234567', dateOfBirth: new Date('1978-09-25'), state: 'Edo State', lga: 'Owan East' },
]

export const seedAdmin = async () => {
  try {
    /* Admin */
    const adminExists = await User.findOne({ role: 'admin' })
    if (!adminExists) {
      await User.create({ fullName: 'System Administrator', email: 'admin@mediconnect.com', password: 'Admin@12345', role: 'admin', isVerified: true, isActive: true })
      console.log('✅ Admin seeded — admin@mediconnect.com / Admin@12345')
    }

    /* Demo doctors */
    for (const d of DEMO_DOCTORS) {
      const exists = await User.findOne({ email: d.email })
      if (!exists) {
        await User.create({ ...d, role: 'doctor', isVerified: true, isActive: true })
      }
    }

    /* Demo patients */
    for (const p of DEMO_PATIENTS) {
      const exists = await User.findOne({ email: p.email })
      if (!exists) {
        await User.create({ ...p, role: 'patient', isVerified: true, isActive: true })
      }
    }

    /* Seed sample audit logs */
    const auditCount = await AuditLog.countDocuments()
    if (auditCount === 0) {
      const admin  = await User.findOne({ role: 'admin' })
      const tunde_ = await User.findOne({ email: 'tunde@email.com' })
      const adaeze_= await User.findOne({ email: 'adaeze@luth.com' })

      const sampleLogs = [
        // Admin logs
        { userId: admin?._id,   action: 'USER_LOGIN',        category: 'auth',   userEmail: 'admin@medrec.com',   userRole: 'admin',   status: 'success', details: {} },
        { userId: admin?._id,   action: 'DOCTOR_REGISTERED', category: 'admin',  userEmail: 'admin@medrec.com',   userRole: 'admin',   status: 'success', details: { doctorEmail: 'fatima@abuth.com' } },
        { userId: admin?._id,   action: 'DOCTOR_VERIFIED',   category: 'admin',  userEmail: 'admin@medrec.com',   userRole: 'admin',   status: 'success', details: { doctorEmail: 'adaeze@luth.com' } },
        // Tunde's own logs
        { userId: tunde_?._id,  action: 'USER_REGISTERED',   category: 'auth',   userEmail: 'tunde@email.com',    userRole: 'patient', status: 'success', details: { role: 'patient' } },
        { userId: tunde_?._id,  action: 'USER_LOGIN',        category: 'auth',   userEmail: 'tunde@email.com',    userRole: 'patient', status: 'success', details: {} },
        { userId: tunde_?._id,  action: 'ACCESS_GRANTED',    category: 'access', userEmail: 'tunde@email.com',    userRole: 'patient', status: 'success', details: { doctorEmail: 'adaeze@luth.com' } },
        { userId: tunde_?._id,  action: 'USER_LOGIN',        category: 'auth',   userEmail: 'tunde@email.com',    userRole: 'patient', status: 'success', details: {} },
        // Other user logs
        { userId: adaeze_?._id, action: 'USER_LOGIN',        category: 'auth',   userEmail: 'adaeze@luth.com',    userRole: 'doctor',  status: 'success', details: {} },
      ]
      await AuditLog.insertMany(sampleLogs)
      console.log('✅ Demo audit logs seeded')
    }

    /* Create demo PDF files on disk (idempotent — overwrites each restart) */
    const demoFiles = createDemoFiles()

    /* Demo medical records for Tunde Bakare */
    const tunde  = await User.findOne({ email: 'tunde@email.com' })
    const adaeze = await User.findOne({ email: 'adaeze@luth.com' })
    const emeka  = await User.findOne({ email: 'emeka@uch.com' })

    if (tunde) {
      const recCount = await MedicalRecord.countDocuments({ patient: tunde._id })
      if (recCount === 0) {
        await MedicalRecord.insertMany([
          {
            patient: tunde._id, uploadedBy: tunde._id,
            title: 'Complete Blood Count (CBC)',
            description: 'Routine full blood count including WBC, RBC, haemoglobin, haematocrit and platelets.',
            recordType: 'lab',
            ...demoFiles.cbc,
            isVerified: true,
          },
          {
            patient: tunde._id, uploadedBy: adaeze?._id || tunde._id,
            title: 'Echocardiogram Report',
            description: 'Transthoracic echocardiogram — left ventricular function assessment.',
            recordType: 'imaging',
            ...demoFiles.echo,
            isVerified: true,
          },
          {
            patient: tunde._id, uploadedBy: adaeze?._id || tunde._id,
            title: 'Antihypertensive Prescription',
            description: 'Amlodipine 5 mg + HCTZ 12.5 mg — 90 day supply.',
            recordType: 'prescription',
            ...demoFiles.rx,
            isVerified: false,
          },
          {
            patient: tunde._id, uploadedBy: emeka?._id || tunde._id,
            title: 'General Consultation Notes',
            description: 'Routine check-up — blood pressure 130/85, BMI 26.4.',
            recordType: 'consultation',
            ...demoFiles.consult,
            isVerified: false,
          },
        ])
      }

      /* Demo access grant: Tunde → Dr. Adaeze */
      if (adaeze) {
        await AccessGrant.findOneAndUpdate(
          { patient: tunde._id, doctor: adaeze._id },
          { isActive: true, grantedAt: new Date('2025-01-10') },
          { upsert: true }
        )
      }
    }

    /* Demo access grant: Amaka → Dr. Adaeze (second patient for richer doctor demo) */
    const amaka   = await User.findOne({ email: 'amaka@email.com' })
    const adaeze2 = await User.findOne({ email: 'adaeze@luth.com' })
    if (amaka && adaeze2) {
      await AccessGrant.findOneAndUpdate(
        { patient: amaka._id, doctor: adaeze2._id },
        { isActive: true, grantedAt: new Date('2025-02-14') },
        { upsert: true }
      )

      const amakaRecs = await MedicalRecord.countDocuments({ patient: amaka._id })
      if (amakaRecs === 0) {
        await MedicalRecord.insertMany([
          {
            patient: amaka._id, uploadedBy: adaeze2._id,
            title: 'Electrocardiogram (ECG)',
            description: '12-lead ECG — normal sinus rhythm, no ST changes.',
            recordType: 'imaging',
            ...demoFiles.ecg_amaka,
            isVerified: true,
          },
          {
            patient: amaka._id, uploadedBy: adaeze2._id,
            title: 'Lipid Profile',
            description: 'Total cholesterol 210 mg/dL, LDL 130 mg/dL, HDL 55 mg/dL.',
            recordType: 'lab',
            ...demoFiles.lipid_amaka,
            isVerified: false,
          },
        ])
      }
    }

    console.log('✅ Demo doctors and patients seeded')
  } catch (err) {
    console.error('Seed error:', err.message)
  }
}
