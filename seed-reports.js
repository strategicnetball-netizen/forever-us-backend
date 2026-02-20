import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const prisma = new PrismaClient()

async function seedReports() {
  try {
    console.log('🌱 Seeding sample reports...\n')

    // Get all users except admin
    const users = await prisma.user.findMany({
      where: {
        email: { not: 'admin@admin.com' }
      },
      take: 20
    })

    if (users.length < 2) {
      console.log('❌ Not enough users to create reports')
      process.exit(1)
    }

    const reportTypes = [
      'inappropriate_message',
      'inappropriate_photo',
      'harassment',
      'spam',
      'fake_profile'
    ]

    const descriptions = {
      inappropriate_message: [
        'User sent offensive and disrespectful messages',
        'Received explicit and unwanted messages',
        'User made inappropriate sexual comments'
      ],
      inappropriate_photo: [
        'Profile contains explicit photos',
        'Photos appear to be fake or stolen',
        'Inappropriate and offensive profile pictures'
      ],
      harassment: [
        'User is harassing me repeatedly',
        'Threatening and abusive behavior',
        'Persistent unwanted contact'
      ],
      spam: [
        'User is spamming with promotional links',
        'Repeated spam messages',
        'Suspicious links and scam attempts'
      ],
      fake_profile: [
        'Profile appears to be fake',
        'Using stolen photos',
        'Suspicious account activity'
      ]
    }

    let reportCount = 0

    // Create reports between different users
    for (let i = 0; i < users.length - 1; i++) {
      const reporter = users[i]
      const reported = users[i + 1]

      // Create 1-2 reports per user pair
      const numReports = Math.random() > 0.5 ? 1 : 2

      for (let j = 0; j < numReports; j++) {
        const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)]
        const descriptionList = descriptions[reportType]
        const description = descriptionList[Math.floor(Math.random() * descriptionList.length)]

        // Randomly set some as resolved
        const status = Math.random() > 0.6 ? 'resolved' : 'pending'
        const action = status === 'resolved' 
          ? ['none', 'warning', 'suspended'][Math.floor(Math.random() * 3)]
          : null

        const report = await prisma.report.create({
          data: {
            reporterId: reporter.id,
            reportedUserId: reported.id,
            type: reportType,
            description,
            status,
            action
          }
        })

        reportCount++
        const statusEmoji = status === 'pending' ? '⏳' : '✅'
        console.log(`${statusEmoji} Report created: ${reporter.name} → ${reported.name} (${reportType})`)
      }
    }

    console.log(`\n✓ Successfully created ${reportCount} sample reports`)
    console.log(`  - Pending reports: ${await prisma.report.count({ where: { status: 'pending' } })}`)
    console.log(`  - Resolved reports: ${await prisma.report.count({ where: { status: 'resolved' } })}`)

    process.exit(0)
  } catch (err) {
    console.error('❌ Error seeding reports:', err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedReports()
