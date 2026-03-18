import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'dev.db')

const db = new Database(dbPath)

const redFlags = [
  'Poor communication',
  'Dishonesty or lying',
  'Lack of ambition',
  'Excessive drinking',
  'Drug use',
  'Disrespectful behavior',
  'Controlling tendencies',
  'Emotional unavailability',
  'Commitment issues',
  'Excessive social media use',
  'Poor hygiene',
  'Rudeness to service workers',
  'Excessive complaining',
  'Lack of empathy',
  'Financial irresponsibility',
  'Infidelity history',
  'Anger management issues',
  'Unwillingness to compromise',
  'Excessive jealousy',
  'Disrespect for boundaries'
]

const dealBreakers = [
  'Wants children',
  'Doesn\'t want children',
  'Smoker',
  'Non-smoker',
  'Heavy drinker',
  'Drug user',
  'Unemployed',
  'Doesn\'t have a job',
  'Different religious beliefs',
  'Wants to relocate',
  'Has children already',
  'Doesn\'t want marriage',
  'Wants marriage immediately',
  'Significant age gap',
  'Different life goals',
  'Unwilling to compromise',
  'Dishonest',
  'Unfaithful history',
  'Controlling behavior',
  'Abusive tendencies'
]

try {
  console.log('Seeding red flags and deal breakers...')

  // Clear existing data
  db.exec('DELETE FROM RedFlagsList')
  db.exec('DELETE FROM DealBreakersList')

  // Seed red flags
  const insertFlag = db.prepare(`
    INSERT INTO RedFlagsList (id, flag, frequency, isActive, "order", createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  for (let i = 0; i < redFlags.length; i++) {
    const id = `flag_${i}_${Date.now()}`
    insertFlag.run(id, redFlags[i], 1, 1, i, new Date().toISOString(), new Date().toISOString())
  }

  // Seed deal breakers
  const insertBreaker = db.prepare(`
    INSERT INTO DealBreakersList (id, breaker, frequency, isActive, "order", createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  for (let i = 0; i < dealBreakers.length; i++) {
    const id = `breaker_${i}_${Date.now()}`
    insertBreaker.run(id, dealBreakers[i], 1, 1, i, new Date().toISOString(), new Date().toISOString())
  }

  console.log('✓ Seeded 20 red flags and 20 deal breakers')
  db.close()
} catch (error) {
  console.error('Error during seeding:', error)
  db.close()
  process.exit(1)
}
