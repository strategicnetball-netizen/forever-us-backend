import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get first user
    const user = await prisma.user.findFirst({
      where: { email: 'user1@example.com' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Testing API response for user:', user.email);
    console.log('User ID:', user.id);

    // Simulate what the API endpoint does
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        photos: true,
        age: true,
        gender: true,
        location: true,
        country: true,
        state: true,
        city: true,
        points: true,
        tier: true,
        isVerified: true,
        introVideoUrl: true,
        createdAt: true,
        redFlagsQuestionnaire: {
          select: {
            selectedFlags: true
          }
        }
      }
    });

    let redFlags = [];
    if (userData.redFlagsQuestionnaire && userData.redFlagsQuestionnaire.selectedFlags) {
      try {
        redFlags = JSON.parse(userData.redFlagsQuestionnaire.selectedFlags);
      } catch (e) {
        console.error('Failed to parse red flags:', e);
      }
    }

    const response = {
      ...userData,
      photos: userData.photos ? JSON.parse(userData.photos) : [],
      redFlags: redFlags,
      redFlagsQuestionnaire: undefined
    };

    console.log('\nAPI Response:');
    console.log(JSON.stringify(response, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
