import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
  try {
    // Get all users
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    console.log('Total users in database:', allUsers.length);
    console.log('Users:', allUsers.map(u => `${u.email} (${u.id})`).join(', '));

    // Get user1 (test user)
    const user1 = await prisma.user.findUnique({
      where: { email: 'user1@example.com' }
    });
    console.log('\nUser1:', user1?.email, 'ID:', user1?.id);

    if (user1) {
      // Get likes for user1
      const likes = await prisma.like.findMany({
        where: { likerId: user1.id },
        select: { likedId: true }
      });
      console.log('User1 has liked:', likes.length, 'users');
      console.log('Liked IDs:', likes.map(l => l.likedId).join(', '));

      // Simulate browse query
      const likedIds = likes.map(like => like.likedId);
      const browseUsers = await prisma.user.findMany({
        where: {
          id: { 
            not: user1.id,
            notIn: likedIds
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          avatar: true,
          age: true,
          gender: true,
          location: true
        },
        take: 20
      });
      console.log('\nBrowse results for user1:', browseUsers.length, 'profiles');
      console.log('Profiles:', browseUsers.map(u => `${u.name} (${u.email})`).join(', '));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
