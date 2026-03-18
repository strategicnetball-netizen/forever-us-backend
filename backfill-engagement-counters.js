import { prisma } from './src/index.js';

async function backfillEngagementCounters() {
  try {
    console.log('Starting backfill of engagement counters...\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });

    console.log(`Found ${users.length} users to process\n`);

    let processed = 0;
    let updated = 0;

    for (const user of users) {
      // Count messages sent
      const messagesSent = await prisma.message.count({
        where: { senderId: user.id }
      });

      // Count messages received
      const messagesReceived = await prisma.message.count({
        where: { receiverId: user.id }
      });

      // Count likes given
      const likesGiven = await prisma.like.count({
        where: { likerId: user.id }
      });

      // Count passes given
      const passesGiven = await prisma.userBehavior.count({
        where: {
          userId: user.id,
          actionType: 'pass'
        }
      });

      // Update user with counters
      if (messagesSent > 0 || messagesReceived > 0 || likesGiven > 0 || passesGiven > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            messagesSent,
            messagesReceived,
            likesGiven,
            passesGiven
          }
        });

        updated++;
        console.log(`✓ ${user.email}`);
        console.log(`  Messages: ${messagesSent} sent, ${messagesReceived} received`);
        console.log(`  Engagement: ${likesGiven} likes, ${passesGiven} passes\n`);
      }

      processed++;
      if (processed % 10 === 0) {
        console.log(`Progress: ${processed}/${users.length} users processed...\n`);
      }
    }

    console.log(`\n✅ Backfill complete!`);
    console.log(`Total users processed: ${processed}`);
    console.log(`Users updated: ${updated}`);

    process.exit(0);
  } catch (err) {
    console.error('Error during backfill:', err);
    process.exit(1);
  }
}

backfillEngagementCounters();
