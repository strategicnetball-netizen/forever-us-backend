import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const answers = [
  { q1: 'Dinner', q2: ['Trust'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Weekend trips'], q8: ['Casual'], q9: ['Yes'], q10: ['Honesty'], q11: ['Active'], q12: 'Yes', q13: 'Humor', q14: ['Ambitious'], q15: ['Sports'], q16: 'Success through growth', q17: 'Failure', q18: ['Very important'], q19: 'Someone kind and genuine', q20: 'Live fully' },
  { q1: 'Outdoor activity', q2: ['Humor'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Dance clubs'], q8: ['Casual'], q9: ['Yes'], q10: ['Ambition'], q11: ['Very active'], q12: 'Yes', q13: 'Kindness', q14: ['Energetic'], q15: ['Art/Music'], q16: 'Living in the moment', q17: 'Boredom', q18: ['Somewhat important'], q19: 'Someone fun', q20: 'Have fun always' }
];

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: ['user1@example.com', 'user20@example.com'] } },
    orderBy: { email: 'asc' }
  });
  
  console.log(`Found ${users.length} users`);
  
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.questionnaire.create({
        data: {
          userId: users[i].id,
          answers: JSON.stringify(answers[i])
        }
      });
      console.log(`Created questionnaire for ${users[i].email}`);
    } catch (err) {
      console.log(`Error for ${users[i].email}:`, err.message);
    }
  }
  
  console.log('Done');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
