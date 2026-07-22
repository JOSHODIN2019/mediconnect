import express      from 'express'
import cors         from 'cors'
import authRoutes   from '../../routes/auth.js'
import adminRoutes  from '../../routes/admin.js'
import patientRoutes from '../../routes/patient.js'
import doctorRoutes from '../../routes/doctor.js'

const noopIo = { to: () => ({ emit: () => {} }) }

export function createTestApp() {
  const app = express()
  app.use(cors({ origin: '*' }))
  app.use(express.json())
  // Inject no-op io so controllers that emit notifications don't throw
  app.use((req, _res, next) => { req.io = noopIo; next() })

  app.use('/api/auth',    authRoutes)
  app.use('/api/admin',   adminRoutes)
  app.use('/api/patient', patientRoutes)
  app.use('/api/doctor',  doctorRoutes)

  app.use((err, req, res, _next) => {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  })

  return app
}
