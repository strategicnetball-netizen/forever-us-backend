import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removeMentalHealthDealBreaker() {
  try {
    console.log('Removing mental health deal breaker...')
    
    const deleted = await prisma.dealBreakersList.deleteMany({
      where: {
        breaker: 'Unresolved trauma or mental health issues'
      }
    })
    
    console.log(`✓ Deleted ${deleted.count} record(s)`)
    
    // Reorder remaining deal breakers
    const remaining = await prisma.dealBreakersList.findMany({
      orderBy: { order: 'asc' }
    })
    
    for (let i = 0; i < remaining.length; i++) {
      await prisma.dealBreakersList.update({
        where: { id: remaining[i].id },
        data: { order: i + 1 }
      })
    }
    
    console.log(`✓ Reordered ${remaining.length} remaining deal breakers`)
    console.log('\n✓ Complete!')
    
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

removeMentalHealthDealBreaker()
