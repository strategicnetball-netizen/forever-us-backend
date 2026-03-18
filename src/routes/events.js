import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Get all upcoming events
router.get('/', async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        eventDate: { gte: new Date() }
      },
      include: {
        organizer: {
          select: { id: true, name: true, avatar: true }
        },
        attendees: {
          select: { userId: true }
        },
        _count: {
          select: { attendees: true }
        }
      },
      orderBy: { eventDate: 'asc' },
      take: 50
    })

    const formatted = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      location: event.location,
      category: event.category,
      organizer: event.organizer,
      attendeeCount: event._count.attendees,
      maxAttendees: event.maxAttendees,
      isFull: event.maxAttendees && event._count.attendees >= event.maxAttendees
    }))

    res.json(formatted)
  } catch (err) {
    console.error('Error fetching events:', err)
    next(err)
  }
})

// Get user's RSVPs (must come before /:id route)
router.get('/user/rsvps', authenticate, async (req, res, next) => {
  try {
    const rsvps = await prisma.eventAttendee.findMany({
      where: { userId: req.userId },
      include: {
        event: {
          include: {
            organizer: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    })

    res.json(rsvps)
  } catch (err) {
    console.error('Error fetching user RSVPs:', err)
    next(err)
  }
})

// Get events by category (must come before /:id route)
router.get('/category/:category', async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        category: req.params.category,
        eventDate: { gte: new Date() }
      },
      include: {
        organizer: {
          select: { id: true, name: true, avatar: true }
        },
        _count: {
          select: { attendees: true }
        }
      },
      orderBy: { eventDate: 'asc' },
      take: 50
    })

    const formatted = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      location: event.location,
      category: event.category,
      organizer: event.organizer,
      attendeeCount: event._count.attendees,
      maxAttendees: event.maxAttendees,
      isFull: event.maxAttendees && event._count.attendees >= event.maxAttendees
    }))

    res.json(formatted)
  } catch (err) {
    console.error('Error fetching events by category:', err)
    next(err)
  }
})

// Get single event with attendees
router.get('/:id', async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        organizer: {
          select: { id: true, name: true, avatar: true }
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    res.json({
      ...event,
      attendeeCount: event.attendees.length,
      isFull: event.maxAttendees && event.attendees.length >= event.maxAttendees
    })
  } catch (err) {
    console.error('Error fetching event:', err)
    next(err)
  }
})

// Create new event (admin only)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title, description, eventDate, location, category, maxAttendees } = req.body

    if (!title || !eventDate || !location || !category) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        eventDate: new Date(eventDate),
        location,
        category,
        maxAttendees: maxAttendees || null,
        organizerId: req.userId
      },
      include: {
        organizer: {
          select: { id: true, name: true, avatar: true }
        }
      }
    })

    res.json(event)
  } catch (err) {
    console.error('Error creating event:', err)
    next(err)
  }
})

// RSVP to event
router.post('/:id/rsvp', authenticate, async (req, res, next) => {
  try {
    const { status } = req.body // 'going', 'interested', 'not_going'

    if (!['going', 'interested', 'not_going'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Check if already RSVPed
    const existing = await prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId: req.params.id,
          userId: req.userId
        }
      }
    })

    if (existing) {
      // Update existing RSVP
      const updated = await prisma.eventAttendee.update({
        where: {
          eventId_userId: {
            eventId: req.params.id,
            userId: req.userId
          }
        },
        data: { status }
      })
      return res.json(updated)
    }

    // Create new RSVP
    const attendee = await prisma.eventAttendee.create({
      data: {
        eventId: req.params.id,
        userId: req.userId,
        status
      }
    })

    res.json(attendee)
  } catch (err) {
    console.error('Error RSVPing to event:', err)
    next(err)
  }
})

// Clean up past events (delete events with dates in the past)
router.post('/cleanup/past-events', async (req, res, next) => {
  try {
    const now = new Date()
    
    // Delete all events where eventDate is in the past
    // EventAttendee records will be cascade deleted due to schema configuration
    const result = await prisma.event.deleteMany({
      where: {
        eventDate: { lt: now }
      }
    })

    res.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} past events`
    })
  } catch (err) {
    console.error('Error cleaning up past events:', err)
    next(err)
  }
})

export default router
