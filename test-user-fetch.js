import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get first user
  const user = await prisma.user.findFirst({
    where: { email: { startsWith: 'user' } }
  });
  
  if (user) {
    console.log('User found:', user.id, user.email);
    
    // Try to fetch it again
    const fetched = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (fetched) {
      console.log('Fetch successful:', fetched.email);
    } else {
      console.log('Fetch failed - user not found');
    }
  } else {
    console.log('No users found');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
