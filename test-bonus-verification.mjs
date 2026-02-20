async function testWithStartingBonus() {
  console.log('=== Testing Like with Starting Bonus ===\n');
  
  // Simulate what would happen if user started with 100 points
  const userPoints = 100;
  const likeCost = 2;
  
  console.log('User starting points:', userPoints);
  console.log('Like cost (free tier):', likeCost);
  console.log('Can like?', userPoints >= likeCost ? 'YES ✓' : 'NO ');
  console.log('Points after like:', userPoints - likeCost);
  console.log('Likes possible:', Math.floor(userPoints / likeCost));
}

testWithStartingBonus();
