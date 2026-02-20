import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'user' } },
    select: { id: true, email: true }
  });
  
  const questionnaires = await prisma.questionnaire.findMany({
    select: { userId: true }
  });
  
  const qUserIds = new Set(questionnaires.map(q => q.userId));
  
  const usersWithoutQ = users.filter(u => !qUserIds.has(u.id));
  
  console.log(`Users without questionnaires: ${usersWithoutQ.length}`);
  usersWithoutQ.forEach(u => {
    console.log(`${u.email} - ${u.id}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
