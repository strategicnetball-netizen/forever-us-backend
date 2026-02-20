import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
  
  const questionnaires = await prisma.questionnaire.findMany();
  console.log('Total questionnaires:', questionnaires.length);
  
  if (questionnaires.length > 0) {
    const q = questionnaires[0];
    const answers = JSON.parse(q.answers);
    console.log('First questionnaire keys:', Object.keys(answers));
    console.log('q15:', answers.q15);
    console.log('q20:', answers.q20);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
