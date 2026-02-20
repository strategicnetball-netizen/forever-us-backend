import axios from 'axios';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-super-secret-key-change-this-in-production-12345';

async function testLikeEndpoint() {
  console.log('=== Testing /api/likes Endpoint ===\n');
  
  // Create a test token
  const testToken = jwt.sign({ userId: 'test-user-123' }, JWT_SECRET);
  console.log('Test Token:', testToken.substring(0, 20) + '...\n');
  
  // Test 1: Like with valid token but non-existent user
  console.log('Test 1: POST /api/likes/target-user-id (valid token, non-existent users)');
  try {
    const response = await axios.post('http://localhost:3000/api/likes/target-user-id', {}, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    console.log(' Status:', response.status);
    console.log(' Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(' Status:', error.response?.status);
    console.log(' Error:', JSON.stringify(error.response?.data, null, 2));
    console.log(' Message:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Like yourself
  console.log('Test 2: POST /api/likes/test-user-123 (like yourself)');
  try {
    const response = await axios.post('http://localhost:3000/api/likes/test-user-123', {}, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    console.log(' Status:', response.status);
    console.log(' Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(' Status:', error.response?.status);
    console.log(' Error:', JSON.stringify(error.response?.data, null, 2));
  }
  
  console.log('\n---\n');
  
  // Test 3: No token
  console.log('Test 3: POST /api/likes/target-user-id (no token)');
  try {
    const response = await axios.post('http://localhost:3000/api/likes/target-user-id', {});
    console.log(' Status:', response.status);
    console.log(' Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(' Status:', error.response?.status);
    console.log(' Error:', JSON.stringify(error.response?.data, null, 2));
  }
}

testLikeEndpoint().catch(console.error);
