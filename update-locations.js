import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Update all users to have country, state, city
    const result = await prisma.user.updateMany({
      where: {
        country: null
      },
      data: {
        country: 'Australia',
        state: 'New South Wales'
      }
    });
    
    console.log(`Updated ${result.count} users with country and state`);
    
    // Also update users where city is null to use their location
    const usersWithLocation = await prisma.user.findMany({
      where: {
        location: { not: null },
        city: null
      }
    });
    
    for (const user of usersWithLocation) {
      await prisma.user.update({
        where: { id: user.id },
        data: { city: user.location }
      });
    }
    
    console.log(`Updated ${usersWithLocation.length} users with city from location`);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
