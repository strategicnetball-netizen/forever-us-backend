import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDB() {
  try {
    const userCount = await prisma.user.count();
    console.log('Total users:', userCount);

    const qCount = await prisma.questionnaire.count();
    console.log('Total questionnaires:', qCount);

    if (qCount > 0) {
      const q = await prisma.questionnaire.findFirst();
      console.log('\nFirst questionnaire user ID:', q.userId);
      
      const user = await prisma.user.findUnique({
        where: { id: q.userId }
      });
      console.log('User email:', user?.email);
      console.log('User name:', user?.name);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
