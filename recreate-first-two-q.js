import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const answers = [
  { q1: 'Dinner', q2: ['Trust'], q3: ['Yes'], q4: 'Spontaneous', q5: ['Extrovert'], q6: 'Yes', q7: ['Weekend trips'], q8: ['Casual'], q9: ['Yes'], q10: ['Honesty'], q11: ['Active'], q12: 'Yes', q13: 'Humor', q14: ['Ambitious'], q15: ['Sports'], q16: 'Success through growth', q17: 'Failure', q18: ['Very important'], q19: 'Someone kind and genuine', q20: 'Live fully' },
  { q1: 'Movie', q2: ['Communication'], q3: ['No'], q4: 'Planned', q5: ['Introvert'], q6: 'No', q7: ['Cozy nights'], q8: ['Serious'], q9: ['No'], q10: ['Loyalty'], q11: ['Relaxed'], q12: 'No', q13: 'Intelligence', q14: ['Creative'], q15: ['Reading'], q16: 'Making a difference', q17: 'Loneliness', q18: ['Important'], q19: 'Someone thoughtful', q20: 'Quality over quantity' }
];

async function main() {
  // Get first two users
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'user' } },
    orderBy: { email: 'asc' },
    take: 2
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
