import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkRedFlags() {
  try {
    console.log('Checking RedFlagsList table...')
    
    const flags = await prisma.redFlagsList.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      take: 20
    })
    
    console.log(`Found ${flags.length} active red flags`)
    
    if (flags.length === 0) {
      console.log('⚠️  No red flags found in database!')
      console.log('\nChecking if table has ANY records...')
      const allFlags = await prisma.redFlagsList.findMany()
      console.log(`Total records in RedFlagsList: ${allFlags.length}`)
      
      if (allFlags.length > 0) {
        console.log('\nFirst 5 records:')
        allFlags.slice(0, 5).forEach(f => {
          console.log(`  - ${f.flag} (isActive: ${f.isActive})`)
        })
      }
    } else {
      console.log('\n✓ Red flags found:')
      flags.forEach((f, idx) => {
        console.log(`  ${idx + 1}. ${f.flag}`)
      })
    }
    
    console.log('\n\nChecking DealBreakersList table...')
    const breakers = await prisma.dealBreakersList.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      take: 20
    })
    
    console.log(`Found ${breakers.length} active deal breakers`)
    
    if (breakers.length === 0) {
      console.log('⚠️  No deal breakers found in database!')
    } else {
      console.log('\n✓ Deal breakers found:')
      breakers.forEach((b, idx) => {
        console.log(`  ${idx + 1}. ${b.breaker}`)
      })
    }
    
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

checkRedFlags()
