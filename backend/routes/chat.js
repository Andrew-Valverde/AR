const express = require('express');
const { PrismaClient } = require('@prisma/client');

const { verifyToken } = require('./auth');

const prisma = new PrismaClient();
const router = express.Router();

router.use(verifyToken);

router.post('/message', async (req, res) => {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    try {
        const pastMessages = await prisma.chatHistory.findMany({
            where:   { usuarioId: userId },
            orderBy: { createdAt: 'asc' }
        });

        const history = pastMessages.flatMap(turn => [
            { role: 'user',  parts: turn.userText   },
            { role: 'model', parts: turn.aiResponse }
        ]);

        const kbEntries = await prisma.knowledgeBase.findMany();
        const knowledgeContext = kbEntries.length
            ? kbEntries.map(e => `[${e.topic}]: ${e.content}`).join('\n')
            : null;

        const aiResponse = await req.aiEngine.Chat(message, history, knowledgeContext);

        if (!aiResponse) {
            return res.status(502).json({ error: 'AI did not return a response.' });
        }

        // Persist the new turn
        const saved = await prisma.chatHistory.create({
            data: {
                userText:   message,
                aiResponse: aiResponse,
                usuarioId:  userId
            }
        });

        res.json({
            id:         saved.id,
            userText:   saved.userText,
            aiResponse: saved.aiResponse,
            createdAt:  saved.createdAt
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Could not process chat message.' });
    }
});


router.get('/history', async (req, res) => {
    const userId = req.user.userId;

    try {
        const history = await prisma.chatHistory.findMany({
            where:   { usuarioId: userId },
            orderBy: { createdAt: 'asc' }
        });

        res.json(history);
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ error: 'Could not retrieve chat history.' });
    }
});


router.delete('/history', async (req, res) => {
    const userId = req.user.userId;

    try {
        const { count } = await prisma.chatHistory.deleteMany({
            where: { usuarioId: userId }
        });

        console.log(`Cleared ${count} chat messages for user ${userId}`);
        res.json({ message: `Deleted ${count} messages.` });
    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({ error: 'Could not clear chat history.' });
    }
});


router.delete('/history/:id', async (req, res) => {
    const userId = req.user.userId;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id.' });

    try {
        const message = await prisma.chatHistory.findUnique({ where: { id } });

        if (!message) return res.status(404).json({ error: 'Message not found.' });
        if (message.usuarioId !== userId) return res.status(403).json({ error: 'Forbidden.' });

        await prisma.chatHistory.delete({ where: { id } });
        res.json({ message: 'Message deleted.' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Could not delete message.' });
    }
});

module.exports = router;
