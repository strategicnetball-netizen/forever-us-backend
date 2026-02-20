const JWT_SECRET = 'your-super-secret-key-change-this-in-production-12345';

// Simple JWT creation (for testing only)
function createTestToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ userId: 'test-user-123' })).toString('base64url');
  // Note: This is not a valid JWT signature, but we'll use it for testing
  return `${header}.${payload}.fake-signature`;
}

async function testLikeEndpoint() {
  console.log('=== Testing /api/likes Endpoint ===\n');
  
  // Test 1: No token
  console.log('Test 1: POST /api/likes/target-user-id (no token)');
  try {
    const response = await fetch('http://localhost:3000/api/likes/target-user-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Invalid token
  console.log('Test 2: POST /api/likes/target-user-id (invalid token)');
  try {
    const response = await fetch('http://localhost:3000/api/likes/target-user-id', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: '{}'
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Like yourself
  console.log('Test 3: POST /api/likes/test-user-123 (like yourself with invalid token)');
  try {
    const response = await fetch('http://localhost:3000/api/likes/test-user-123', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: '{}'
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testLikeEndpoint().catch(console.error);
