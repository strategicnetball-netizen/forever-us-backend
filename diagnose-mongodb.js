import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnose() {
  console.log('='.repeat(60))
  console.log('MongoDB Connection Diagnostic')
  console.log('='.repeat(60))
  
  console.log('\n1. Environment Check:')
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set')
  
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL
    const match = url.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@/)
    if (match) {
      console.log('   Username:', match[1])
      console.log('   Password: (hidden)')
      console.log('   Connection type: MongoDB Atlas')
    }
  }
  
  console.log('\n2. Connection Test:')
  try {
    const userCount = await prisma.user.count()
    console.log('   ✓ Connection successful!')
    console.log('   Users in database:', userCount)
    
    console.log('\n3. Database Status:')
    console.log('   ✓ Database is accessible')
    console.log('   ✓ Ready to create admin account')
    
    console.log('\n4. Next Steps:')
    console.log('   Run: node create-admin-simple.js')
    
  } catch (error) {
    console.log('   ✗ Connection failed!')
    console.log('   Error:', error.message)
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n3. Diagnosis:')
      console.log('   ✗ MongoDB Atlas authentication failed')
      console.log('   Possible causes:')
      console.log('   - Password is incorrect')
      console.log('   - Password needs to be reset')
      console.log('   - Username is wrong')
      console.log('   - IP not whitelisted')
      
      console.log('\n4. Solutions:')
      console.log('   1. Reset password in MongoDB Atlas:')
      console.log('      - Go to https://cloud.mongodb.com')
      console.log('      - Security → Database Access')
      console.log('      - Edit admin user → Generate Secure Password')
      console.log('      - Update .env with new password (URL-encoded)')
      console.log('      - Restart backend')
      console.log('')
      console.log('   2. Or use local MongoDB instead:')
      console.log('      - Install MongoDB Community Edition')
      console.log('      - Update .env: DATABASE_URL="mongodb://localhost:27017/forever_us"')
      console.log('      - Restart backend')
    }
  } finally {
    await prisma.$disconnect()
  }
  
  console.log('\n' + '='.repeat(60))
}

diagnose()
