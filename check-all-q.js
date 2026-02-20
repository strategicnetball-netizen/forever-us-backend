import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const questionnaires = await prisma.questionnaire.findMany();
  
  questionnaires.forEach((q, idx) => {
    const answers = JSON.parse(q.answers);
    const keys = Object.keys(answers);
    console.log(`Q${idx + 1}: ${keys.length} keys - q15: ${answers.q15}, q20: ${answers.q20}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
