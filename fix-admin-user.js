import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdminUser() {
  try {
    const adminEmail = 'admin@foreverus-dating.com';
    const adminPassword = 'admin@123456';
    
    // Check if admin user exists
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (admin) {
      console.log('Admin user found, updating isAdmin flag...');
      admin = await prisma.user.update({
        where: { email: adminEmail },
        data: { isAdmin: true }
      });
      console.log('✓ Admin user updated:', admin.email, 'isAdmin:', admin.isAdmin);
    } else {
      console.log('Admin user not found, creating new admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Admin',
          age: 30,
          isAdmin: true,
          profileCompleted: true,
          points: 10000,
          tier: 'vip'
        }
      });
      console.log('✓ Admin user created:', admin.email, 'isAdmin:', admin.isAdmin);
    }
    
    console.log('\nAdmin setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAdminUser();
