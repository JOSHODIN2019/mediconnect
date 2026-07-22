import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongod

export async function connectTestDB() {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
}

export async function disconnectTestDB() {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
  await mongod.stop()
}

export async function clearCollections() {
  const cols = mongoose.connection.collections
  await Promise.all(Object.values(cols).map(c => c.deleteMany({})))
}
