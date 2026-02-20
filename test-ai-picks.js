import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  // Get first user
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.log('No users found');
    return;
  }

  console.log('Testing with user:', user.email);

  // Create a token
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key');

  // Simulate the AI picks query
  const userId = user.id;

  // Get all users except self
  const allUsers = await prisma.user.findMany({
    where: {
      id: { not: userId }
    },
    select: {
      id: true,
      name: true,
      age: true,
      bio: true,
      avatar: true,
      location: true,
      tier: true
    },
    take: 100
  });

  console.log('All available users:', allUsers.length);

  // Get user's blocked list (users that current user has blocked)
  const blockedUsers = await prisma.blockedUser.findMany({
    where: { blockerId: userId },
    select: { blockedId: true }
  });
  const blockedIds = blockedUsers.map(b => b.blockedId);

  // Get users the current user has already liked
  const likedUsers = await prisma.like.findMany({
    where: { likerId: userId },
    select: { likedId: true }
  });
  const likedIds = likedUsers.map(l => l.likedId);

  // Filter out blocked and liked users
  const availableUsers = allUsers.filter(u => !blockedIds.includes(u.id) && !likedIds.includes(u.id));
  console.log('Available users after filtering:', availableUsers.length);

  // Simple AI pick: randomly select 2 from available users
  const shuffled = availableUsers.sort(() => Math.random() - 0.5);
  const aiPicks = shuffled.slice(0, 2);

  console.log('AI Picks:', aiPicks);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
