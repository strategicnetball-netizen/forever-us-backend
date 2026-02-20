import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting simple seed...');
  
  try {
    const password = await bcrypt.hash('password123', 10);
    console.log('Password hashed');
    
    const user = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        password,
        name: 'Sarah',
        bio: 'Love hiking',
        age: 25,
        gender: 'female',
        location: 'New York',
        avatar: 'https://i.pravatar.cc/150?img=1',
        points: 0,
        tier: 'premium'
      }
    });
    console.log('User created:', user.id);
    
    const q = await prisma.questionnaire.create({
      data: {
        userId: user.id,
        answers: JSON.stringify({ q1: 'Dinner', q15: 'Sports', q20: 'Live fully' })
      }
    });
    console.log('Questionnaire created:', q.id);
    console.log('Simple seed completed!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
