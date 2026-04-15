const express = require('express');
const { PrismaClient } = require('@prisma/client');

const { verifyToken } = require('./auth');

const prisma = new PrismaClient();
const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
    try {
        const entries = await prisma.knowledgeBase.findMany({
            orderBy: { topic: 'asc' }
        });
        res.json(entries);
    } catch (error) {
        console.error('Knowledge fetch error:', error);
        res.status(500).json({ error: 'Could not retrieve knowledge base.' });
    }
});

router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id.' });

    try {
        const entry = await prisma.knowledgeBase.findUnique({ where: { id } });
        if (!entry) return res.status(404).json({ error: 'Entry not found.' });
        res.json(entry);
    } catch (error) {
        console.error('Knowledge fetch error:', error);
        res.status(500).json({ error: 'Could not retrieve entry.' });
    }
});

router.post('/', async (req, res) => {
    const { topic, content } = req.body;

    if (!topic || !content) {
        return res.status(400).json({ error: 'Topic and content are required.' });
    }

    try {
        const entry = await prisma.knowledgeBase.create({
            data: { topic, content }
        });
        res.status(201).json(entry);
    } catch (error) {
        console.error('Knowledge create error:', error);
        res.status(500).json({ error: 'Could not create entry.' });
    }
});

router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id.' });

    const { topic, content } = req.body;
    if (!topic && !content) {
        return res.status(400).json({ error: 'At least one of topic or content must be provided.' });
    }

    try {
        const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Entry not found.' });

        const updated = await prisma.knowledgeBase.update({
            where: { id },
            data:  { ...(topic && { topic }), ...(content && { content }) }
        });

        res.json(updated);
    } catch (error) {
        console.error('Knowledge update error:', error);
        res.status(500).json({ error: 'Could not update entry.' });
    }
});

router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id.' });

    try {
        const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Entry not found.' });

        await prisma.knowledgeBase.delete({ where: { id } });
        res.json({ message: 'Entry deleted.' });
    } catch (error) {
        console.error('Knowledge delete error:', error);
        res.status(500).json({ error: 'Could not delete entry.' });
    }
});

module.exports = router;
