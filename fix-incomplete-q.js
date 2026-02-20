import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find questionnaires with less than 20 keys
  const allQ = await prisma.questionnaire.findMany();
  
  const incomplete = allQ.filter(q => {
    const answers = JSON.parse(q.answers);
    return Object.keys(answers).length < 20;
  });
  
  console.log(`Found ${incomplete.length} incomplete questionnaires`);
  
  // Delete them
  for (const q of incomplete) {
    await prisma.questionnaire.delete({
      where: { id: q.id }
    });
    console.log(`Deleted questionnaire for user ${q.userId}`);
  }
  
  console.log('Cleanup complete');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
