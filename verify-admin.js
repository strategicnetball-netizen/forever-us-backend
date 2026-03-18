import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@foreverus-dating.com' },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true
      }
    });
    
    if (admin) {
      console.log('✓ Admin user found:');
      console.log(JSON.stringify(admin, null, 2));
    } else {
      console.log('✗ Admin user NOT found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAdmin();
