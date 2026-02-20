import { prisma } from '../index.js'

const FRAUD_CONFIG = {
  MAX_ADS_PER_HOUR: 10,
  MIN_AD_WATCH_TIME: 5, // seconds
  MAX_COMPLETIONS_PER_DAY: 50,
  FRAUD_SCORE_THRESHOLD: 50,
  RAPID_COMPLETION_PENALTY: 15,
  RATE_LIMIT_PENALTY: 10,
}

export async function checkAdFraud(userId, adDuration) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) return { isFraud: false, score: 0 }

  let fraudScore = user.fraudScore || 0
  const alerts = []

  // Check daily completion limit
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const resetDate = user.adCompletionsResetDate ? new Date(user.adCompletionsResetDate) : null
  resetDate?.setHours(0, 0, 0, 0)

  let completionsToday = user.adCompletionsToday || 0
  if (!resetDate || resetDate.getTime() !== today.getTime()) {
    completionsToday = 0
  }

  if (completionsToday >= FRAUD_CONFIG.MAX_COMPLETIONS_PER_DAY) {
    fraudScore += FRAUD_CONFIG.RATE_LIMIT_PENALTY
    alerts.push({
      type: 'rate_limit_exceeded',
      severity: 'high',
      description: `User exceeded daily ad completion limit (${FRAUD_CONFIG.MAX_COMPLETIONS_PER_DAY})`
    })
  }

  // Check hourly rate
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentCompletions = await prisma.adView.count({
    where: {
      userId,
      completed: true,
      createdAt: { gte: oneHourAgo }
    }
  })

  if (recentCompletions >= FRAUD_CONFIG.MAX_ADS_PER_HOUR) {
    fraudScore += FRAUD_CONFIG.RATE_LIMIT_PENALTY
    alerts.push({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      description: `User completed ${recentCompletions} ads in the last hour`
    })
  }

  // Check for account age (new accounts are higher risk)
  const accountAgeInDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  if (accountAgeInDays < 7 && completionsToday > 20) {
    fraudScore += 10
    alerts.push({
      type: 'suspicious_pattern',
      severity: 'medium',
      description: 'New account with high ad completion rate'
    })
  }

  // Update user fraud score and flag if needed
  const isFlagged = fraudScore >= FRAUD_CONFIG.FRAUD_SCORE_THRESHOLD
  
  if (alerts.length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        fraudScore,
        isFlagged
      }
    })

    // Create fraud alerts
    for (const alert of alerts) {
      await prisma.fraudAlert.create({
        data: {
          userId,
          ...alert
        }
      })
    }
  }

  return {
    isFraud: isFlagged,
    score: fraudScore,
    alerts
  }
}

export async function recordAdCompletion(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const resetDate = user.adCompletionsResetDate ? new Date(user.adCompletionsResetDate) : null
  resetDate?.setHours(0, 0, 0, 0)

  let completionsToday = user.adCompletionsToday || 0
  let resetDateToUse = user.adCompletionsResetDate

  if (!resetDate || resetDate.getTime() !== today.getTime()) {
    completionsToday = 0
    resetDateToUse = today
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      adCompletionsToday: completionsToday + 1,
      adCompletionsResetDate: resetDateToUse,
      lastAdCompletedAt: new Date()
    }
  })
}

export function shouldBlockUser(fraudScore) {
  return fraudScore >= FRAUD_CONFIG.FRAUD_SCORE_THRESHOLD
}

export async function detectBotBehavior(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { questionnaire: true }
  })

  if (!user) return { isBot: false, score: 0 }

  let botScore = 0
  const indicators = []

  // Check profile completeness
  if (!user.bio || user.bio.length < 10) {
    botScore += 10
    indicators.push('Incomplete or missing bio')
  }

  if (!user.photos || JSON.parse(user.photos || '[]').length === 0) {
    botScore += 15
    indicators.push('No profile photos')
  }

  if (!user.age || !user.gender || !user.location) {
    botScore += 10
    indicators.push('Missing basic profile info')
  }

  // Check questionnaire completion
  const accountAgeInDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  if (accountAgeInDays > 1 && !user.questionnaire) {
    botScore += 20
    indicators.push('No questionnaire after 1+ day')
  }

  // Check engagement patterns
  const likes = await prisma.like.count({
    where: { likerId: userId }
  })

  const messages = await prisma.message.count({
    where: { senderId: userId }
  })

  const adViews = await prisma.adView.count({
    where: { userId }
  })

  // If user has done many ads but no dating engagement
  if (adViews > 50 && likes === 0 && messages === 0) {
    botScore += 25
    indicators.push('High ad activity with zero dating engagement')
  }

  // If user has done ads but no profile completion
  if (adViews > 20 && (!user.questionnaire || !user.photos)) {
    botScore += 15
    indicators.push('Ad farming without profile setup')
  }

  return {
    isBot: botScore >= 40,
    score: botScore,
    indicators
  }
}
