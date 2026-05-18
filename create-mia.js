import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const password = await bcrypt.hash('test123', 10);
    
    const mia = await prisma.user.create({
      data: {
        email: 'mia@test.com',
        password,
        name: 'Mia',
        bio: 'Test VIP user',
        age: 25,
        gender: 'female',
        location: 'Test City',
        avatar: 'https://i.pravatar.cc/150?img=1',
        points: 0,
        tier: 'vip',
        isAdmin: false
      }
    });

    console.log('✓ Mia user created:', mia.email, `(${mia.tier})`);
  } catch (err) {
    console.error('Error:', err.message);
    throw err;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
