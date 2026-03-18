import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3002';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testAdLimit() {
  try {
    console.log('🧪 Testing Ad Daily Limit Feature\n');

    // Get test user
    const user = await prisma.user.findUnique({
      where: { email: 'user1@example.com' },
      select: { id: true, email: true, adCompletionsToday: true, adCompletionsResetDate: true }
    });

    if (!user) {
      console.error('❌ Test user not found');
      return;
    }

    console.log(`✅ Found test user: ${user.email}`);
    console.log(`   Current ad completions today: ${user.adCompletionsToday}`);
    console.log(`   Reset date: ${user.adCompletionsResetDate}\n`);

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    console.log(`✅ Generated JWT token\n`);

    // Get ads
    const adsResponse = await fetch(`${API_URL}/api/ads`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const ads = await adsResponse.json();
    console.log(`✅ Found ${ads.length} ads available`);
    if (ads.length > 0) {
      console.log(`   First ad: ${ads[0].title} (${ads[0].rewardPoints} points)\n`);
    }

    if (ads.length === 0) {
      console.error('❌ No ads found in database');
      return;
    }

    // Test watching ads up to the limit
    const adId = ads[0].id;
    console.log(`🎬 Testing ad completion limit (max 10 ads/day)...\n`);

    // Reset user's ad count for testing
    await prisma.user.update({
      where: { id: user.id },
      data: {
        adCompletionsToday: 0,
        adCompletionsResetDate: new Date()
      }
    });
    console.log('✅ Reset ad counter to 0\n');

    // Try to complete 12 ads (should fail on 11th)
    for (let i = 1; i <= 12; i++) {
      try {
        // Start watching
        const viewResponse = await fetch(`${API_URL}/api/ads/${adId}/view`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });

        // Complete watching
        const completeResponse = await fetch(`${API_URL}/api/ads/${adId}/complete`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (completeResponse.status === 429) {
          const data = await completeResponse.json();
          console.log(`⛔ Ad ${i}: Daily limit reached (as expected)`);
          console.log(`   Error: ${data.error}`);
          console.log(`   Remaining: ${data.remaining}/${data.limit}`);
        } else if (completeResponse.ok) {
          const data = await completeResponse.json();
          console.log(`✅ Ad ${i}: Successfully completed - Earned ${data.earned} points`);
        } else {
          const data = await completeResponse.json();
          console.error(`❌ Ad ${i}: Error - ${data.error}`);
        }
      } catch (err) {
        console.error(`❌ Ad ${i}: Request failed - ${err.message}`);
      }
    }

    // Check final user state
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { adCompletionsToday: true, points: true }
    });

    console.log(`\n📊 Final Results:`);
    console.log(`   Ads completed today: ${finalUser.adCompletionsToday}/10`);
    console.log(`   Total points: ${finalUser.points}`);

    if (finalUser.adCompletionsToday === 10) {
      console.log('\n✅ SUCCESS: Ad daily limit is working correctly!');
    } else {
      console.log('\n⚠️  WARNING: Ad limit may not be working as expected');
    }

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAdLimit();
