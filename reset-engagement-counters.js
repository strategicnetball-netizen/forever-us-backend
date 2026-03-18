import { prisma } from './src/index.js';

async function resetEngagementCounters() {
  try {
    console.log('⚠️  WARNING: This will reset ALL engagement counters to 0\n');
    console.log('This action cannot be undone!\n');

    // Confirm action
    const args = process.argv.slice(2);
    if (!args.includes('--confirm')) {
      console.log('To proceed, run with --confirm flag:');
      console.log('  node reset-engagement-counters.js --confirm\n');
      process.exit(0);
    }

    console.log('Resetting all engagement counters...\n');

    // Reset all counters to 0
    const result = await prisma.user.updateMany({
      data: {
        messagesSent: 0,
        messagesReceived: 0,
        likesGiven: 0,
        passesGiven: 0
      }
    });

    console.log(`✅ Reset complete!`);
    console.log(`Total users updated: ${result.count}`);
    console.log('\nAll engagement counters are now at 0');
    console.log('New activity will be tracked from this point forward.\n');

    process.exit(0);
  } catch (err) {
    console.error('Error during reset:', err);
    process.exit(1);
  }
}

resetEngagementCounters();
