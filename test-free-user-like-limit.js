import axios from 'axios';

const API_URL = 'http://localhost:3001';

// Test free user like limit (5 free + 7 payable = 12 total)
async function testFreeLikeLimit() {
  try {
    console.log('Testing free user coin-bypass like limit...\n');
    
    // Login as a free user
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'user1@example.com',
      password: 'password'
    });
    
    const token = loginRes.data.token;
    const userId = loginRes.data.user.id;
    
    console.log(`✓ Logged in as user1 (free tier)`);
    console.log(`  User ID: ${userId}\n`);
    
    // Get initial like status
    const limitsRes = await axios.get(`${API_URL}/limits`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Initial like status:');
    console.log(`  Likes used today: ${limitsRes.data.likesUsedToday}`);
    console.log(`  Tier: ${limitsRes.data.tier}`);
    console.log(`  Remaining: ${limitsRes.data.remaining}`);
    console.log(`  Limit: ${limitsRes.data.limit}`);
    console.log(`  Cost per like: ${limitsRes.data.costPerLike}\n`);
    
    // Expected: 5 free + 7 payable = 12 total
    if (limitsRes.data.limit === 12) {
      console.log('✓ PASS: Free user limit is correctly set to 12 (5 free + 7 payable)');
    } else {
      console.log(`✗ FAIL: Expected limit 12, got ${limitsRes.data.limit}`);
    }
    
    console.log('\nLimit breakdown:');
    console.log('  - First 5 likes: FREE');
    console.log('  - Next 7 likes: 2 coins each (payable)');
    console.log('  - Total max: 12 likes per day');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testFreeLikeLimit();
