import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const questionnaires = await prisma.questionnaire.findMany();

  console.log('Total questionnaires:', questionnaires.length);
  questionnaires.slice(0, 3).forEach(q => {
    console.log('User ID:', q.userId);
    const answers = JSON.parse(q.answers);
    console.log('Keys:', Object.keys(answers));
    console.log('q15:', answers.q15);
    console.log('q16:', answers.q16);
    console.log('q17:', answers.q17);
    console.log('q18:', answers.q18);
    console.log('q19:', answers.q19);
    console.log('q20:', answers.q20);
    console.log('---');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
