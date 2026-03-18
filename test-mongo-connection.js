import { MongoClient } from 'mongodb'

const connectionString = 'mongodb+srv://admin:Faith%40Miley2025@foreverusdating.e3wgumd.mongodb.net/forever_us?retryWrites=true&w=majority'

async function testConnection() {
  const client = new MongoClient(connectionString)
  try {
    await client.connect()
    console.log('✓ MongoDB connection successful!')
    
    const db = client.db('forever_us')
    const collections = await db.listCollections().toArray()
    console.log('Collections:', collections.map(c => c.name))
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message)
  } finally {
    await client.close()
  }
}

testConnection()
