import mongoose from 'mongoose'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

let memServer = null

export const connectDB = async () => {
  try {
    // ── Production / Atlas ───────────────────────────────────────────────────
    // If MONGODB_URI is set and points to Atlas (not localhost), connect directly
    const uri = process.env.MONGODB_URI
    if (uri && !uri.includes('localhost') && !uri.includes('127.0.0.1')) {
      await mongoose.connect(uri)
      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`)
      return
    }

    // ── Development: try local MongoDB first ─────────────────────────────────
    if (uri) {
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 })
        console.log(`✅ MongoDB connected: ${mongoose.connection.host}`)
        return
      } catch {
        // Local MongoDB not running — fall through to in-memory
      }
    }

    // ── Fallback: persistent in-memory MongoDB (dev only) ────────────────────
    let MongoMemoryServer
    try {
      ;({ MongoMemoryServer } = await import('mongodb-memory-server'))
    } catch {
      throw new Error(
        'No MongoDB URI configured and mongodb-memory-server is not installed.\n' +
        'Set MONGODB_URI in your environment variables.'
      )
    }

    const dbPath = join(__dirname, '../.mongodata')
    mkdirSync(dbPath, { recursive: true })

    console.log('Local MongoDB not found — starting persistent MongoDB…')
    memServer = await MongoMemoryServer.create({
      instance: {
        port:          27889,
        dbName:        'mediconnect',
        dbPath,
        storageEngine: 'wiredTiger',
      },
    })
    const memUri = memServer.getUri('mediconnect')
    await mongoose.connect(memUri)
    console.log('✅ Persistent MongoDB started — data survives restarts')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('   MongoDB Compass URI: mongodb://127.0.0.1:27889/')
    console.log('   Database name:       mediconnect')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

export const disconnectDB = async () => {
  await mongoose.disconnect()
  if (memServer) await memServer.stop()
}
