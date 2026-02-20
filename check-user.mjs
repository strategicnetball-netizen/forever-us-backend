import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'user14@example.com' },
    select: { email: true, name: true, lastSignInDate: true, createdAt: true, id: true }
  })
  
  console.log('User14 Info:')
  console.log(JSON.stringify(user, null, 2))
  
  // Also check AI picks
  const aiPicks = await prisma.aIPick.findMany({
    where: { userId: user?.id },
    select: { id, createdAt, pickedUserId }
  })
  
  console.log('\nAI Picks for user14:')
  console.log(JSON.stringify(aiPicks, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
