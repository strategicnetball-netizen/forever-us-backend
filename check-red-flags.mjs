import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const redFlags = await prisma.redFlagsList.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      take: 20
    });

    console.log('Red Flags Count:', redFlags.length);
    console.log('Red Flags:', redFlags.map(f => f.flag));

    const dealBreakers = await prisma.dealBreakersList.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      take: 20
    });

    console.log('\nDeal Breakers Count:', dealBreakers.length);
    console.log('Deal Breakers:', dealBreakers.map(b => b.breaker));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
