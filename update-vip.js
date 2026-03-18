import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Updating all dummy profiles to VIP...');
    
    const result = await prisma.user.updateMany({
      where: {
        email: {
          startsWith: 'user'
        }
      },
      data: {
        tier: 'vip'
      }
    });
    
    console.log(`Updated ${result.count} users to VIP tier`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
