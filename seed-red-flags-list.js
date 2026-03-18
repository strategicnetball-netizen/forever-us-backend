import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const redFlags = [
  'Dishonesty or lying',
  'Lack of respect for boundaries',
  'Controlling behavior',
  'Excessive jealousy',
  'Poor communication',
  'Unwillingness to compromise',
  'Disrespect toward family/friends',
  'Financial irresponsibility',
  'Substance abuse issues',
  'Anger management problems',
  'Infidelity or cheating',
  'Lack of ambition or direction',
  'Emotional unavailability',
  'Manipulation or gaslighting',
  'Disrespect toward service workers',
  'Excessive social media obsession',
  'Unwillingness to discuss future',
  'Poor hygiene or self-care',
  'Dismissive of your interests',
  'Unresolved trauma without help'
]

async function main() {
  console.log('Seeding red flags list...')
  
  // Clear existing flags
  await prisma.redFlagsList.deleteMany({})
  
  // Add new flags
  for (let i = 0; i < redFlags.length; i++) {
    await prisma.redFlagsList.create({
      data: {
        flag: redFlags[i],
        order: i + 1,
        isActive: true
      }
    })
  }
  
  console.log(`✓ Seeded ${redFlags.length} red flags`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
