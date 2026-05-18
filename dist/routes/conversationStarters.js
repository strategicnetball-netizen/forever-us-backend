import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Conversation starter templates based on questionnaire answers
const generateStarters = (recipientProfile) => {
    const starters = [];
    // Extract key info from profile
    const { name, bio, questionnaire } = recipientProfile;
    let answers = {};
    // Parse questionnaire safely
    if (questionnaire) {
        try {
            answers = typeof questionnaire === 'string' ? JSON.parse(questionnaire) : questionnaire;
        }
        catch (err) {
            console.error('Failed to parse questionnaire:', err);
            answers = {};
        }
    }
    // Travel interest
    if (answers.q3 === 'Travel frequently' || bio?.toLowerCase().includes('travel')) {
        starters.push(`I saw you love traveling! What's been your favorite destination so far?`);
        starters.push(`Where's the next place on your travel bucket list?`);
    }
    // Fitness/Health
    if (answers.q4 === 'Very active' || bio?.toLowerCase().includes('gym') || bio?.toLowerCase().includes('fitness')) {
        starters.push(`I noticed you're into fitness - what's your favorite workout?`);
        starters.push(`Do you have a favorite gym or outdoor spot to exercise?`);
    }
    // Food/Cooking
    if (bio?.toLowerCase().includes('cook') || bio?.toLowerCase().includes('food') || bio?.toLowerCase().includes('chef')) {
        starters.push(`I love that you're into cooking! What's your signature dish?`);
        starters.push(`What's your favorite cuisine to cook or eat?`);
    }
    // Music
    if (bio?.toLowerCase().includes('music') || bio?.toLowerCase().includes('concert') || bio?.toLowerCase().includes('band')) {
        starters.push(`I saw you're into music - who's your favorite artist?`);
        starters.push(`What's the last concert you went to?`);
    }
    // Outdoor activities
    if (answers.q4 === 'Moderately active' || bio?.toLowerCase().includes('hiking') || bio?.toLowerCase().includes('outdoor')) {
        starters.push(`You seem like an outdoor person - what's your favorite activity?`);
        starters.push(`Have you explored any good hiking trails lately?`);
    }
    // Career/Ambition
    if (answers.q7 === 'Very ambitious' || bio?.toLowerCase().includes('entrepreneur') || bio?.toLowerCase().includes('startup')) {
        starters.push(`I'm impressed by your ambition! What are you working on right now?`);
        starters.push(`What's your biggest career goal?`);
    }
    // Pets
    if (bio?.toLowerCase().includes('dog') || bio?.toLowerCase().includes('cat') || bio?.toLowerCase().includes('pet')) {
        starters.push(`I see you have pets! Tell me about them 🐾`);
        starters.push(`What's your pet's name and personality like?`);
    }
    // Movies/Entertainment
    if (bio?.toLowerCase().includes('movie') || bio?.toLowerCase().includes('netflix') || bio?.toLowerCase().includes('show')) {
        starters.push(`What's your favorite movie or show right now?`);
        starters.push(`Are you more of a movie or series person?`);
    }
    // General fallback starters (always include)
    const fallbacks = [
        `Hi ${name}! I'd love to get to know you better 😊`,
        `What's something interesting about you that's not in your profile?`,
        `If you could do anything this weekend, what would it be?`,
        `What's your idea of a perfect date?`,
        `Tell me something that makes you laugh!`
    ];
    // If we have specific starters, use them; otherwise use fallbacks
    if (starters.length === 0) {
        return fallbacks.slice(0, 5);
    }
    // Combine specific starters with fallbacks, limit to 5
    return [...starters, ...fallbacks].slice(0, 5);
};
// Generate conversation starters for a recipient
router.post('/generate-starters', authenticate, async (req, res) => {
    try {
        const { recipientId } = req.body;
        if (!recipientId) {
            return res.status(400).json({ error: 'recipientId is required' });
        }
        // Get recipient's profile
        const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
            select: {
                id: true,
                name: true,
                bio: true,
                questionnaire: true
            }
        });
        if (!recipient) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Generate starters
        const starters = generateStarters(recipient);
        res.json({ starters });
    }
    catch (err) {
        console.error('Error generating conversation starters:', err);
        res.status(500).json({ error: 'Failed to generate starters' });
    }
});
export default router;
