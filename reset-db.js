import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting all data...');
  
  // Delete in order of dependencies
  await prisma.questionnaire.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('Database cleared!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
