console.log('Starting seed wrapper...');
import('./prisma/seed.js').then(() => {
  console.log('Seed completed');
}).catch(err => {
  console.error('Seed failed:', err);
});
