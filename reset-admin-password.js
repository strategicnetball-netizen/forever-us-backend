import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const adminEmail = 'admin@foreverus-dating.com';
    const adminPassword = 'admin@123456';
    
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const admin = await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword }
    });
    
    console.log('✓ Admin password reset successfully');
    console.log('Email:', admin.email);
    console.log('isAdmin:', admin.isAdmin);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
