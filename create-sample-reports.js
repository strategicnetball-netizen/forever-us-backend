import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createReports() {
  try {
    console.log('Creating sample reports...\n')

    const users = await prisma.user.findMany({
      where: { email: { not: 'admin@admin.com' } },
      take: 20
    })

    if (users.length < 2) {
      console.log('Not enough users')
      process.exit(1)
    }

    const reportTypes = ['inappropriate_message', 'inappropriate_photo', 'harassment', 'spam', 'fake_profile']
    const descriptions = {
      inappropriate_message: ['User sent offensive messages', 'Explicit and unwanted messages', 'Inappropriate sexual comments'],
      inappropriate_photo: ['Profile contains explicit photos', 'Fake or stolen photos', 'Offensive profile pictures'],
      harassment: ['User is harassing me', 'Threatening behavior', 'Persistent unwanted contact'],
      spam: ['Spamming with promotional links', 'Repeated spam messages', 'Suspicious links'],
      fake_profile: ['Profile appears fake', 'Using stolen photos', 'Suspicious activity']
    }

    let count = 0
    for (let i = 0; i < users.length - 1; i++) {
      const numReports = Math.random() > 0.5 ? 1 : 2
      for (let j = 0; j < numReports; j++) {
        const type = reportTypes[Math.floor(Math.random() * reportTypes.length)]
        const desc = descriptions[type][Math.floor(Math.random() * descriptions[type].length)]
        const status = Math.random() > 0.6 ? 'resolved' : 'pending'
        const action = status === 'resolved' ? ['none', 'warning', 'suspended'][Math.floor(Math.random() * 3)] : null

        await prisma.report.create({
          data: {
            reporterId: users[i].id,
            reportedUserId: users[i + 1].id,
            type,
            description: desc,
            status,
            action
          }
        })
        count++
        console.log(`✓ Report ${count}: ${users[i].name} → ${users[i + 1].name}`)
      }
    }

    console.log(`\n✓ Created ${count} reports`)
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

createReports()
