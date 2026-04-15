const express = require('express');
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/analyzer/scan
 * Body: multipart/form-data  { image: <file> }
 * Returns the AR insight JSON produced by DataManager (cached or fresh from Gemini).
 * Requires: req.dataManager injected by index.js
 */
router.post('/scan', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Validate that the uploaded file is an image
    if (!mimeType.startsWith('image/')) {
        fs.unlinkSync(filePath);
        return res.status(415).json({ error: 'Uploaded file must be an image.' });
    }

    try {
        const result = await req.dataManager.processImage(filePath, mimeType);
        res.json(result);
    } catch (error) {
        console.error('Analyzer error:', error);
        res.status(500).json({ error: 'Image analysis failed.' });
    } finally {
        // Clean up temp upload regardless of outcome
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
});

/**
 * GET /api/analyzer/history
 * Returns all cached image analyses stored in the database.
 */
router.get('/history', async (req, res) => {
    try {
        const records = await req.dataManager.prisma.imageAnalysis.findMany({
            orderBy: { createdAt: 'desc' }
        });

        const parsed = records.map(r => ({
            id:          r.id,
            imageHash:   r.imageHash,
            createdAt:   r.createdAt,
            objectsData: JSON.parse(r.objectsData)
        }));

        res.json(parsed);
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ error: 'Could not retrieve analysis history.' });
    }
});

/**
 * GET /api/analyzer/history/:id
 * Returns a single cached image analysis by its DB id.
 */
router.get('/history/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id.' });

    try {
        const record = await req.dataManager.prisma.imageAnalysis.findUnique({
            where: { id }
        });

        if (!record) return res.status(404).json({ error: 'Record not found.' });

        res.json({
            id:          record.id,
            imageHash:   record.imageHash,
            createdAt:   record.createdAt,
            objectsData: JSON.parse(record.objectsData)
        });
    } catch (error) {
        console.error('Record fetch error:', error);
        res.status(500).json({ error: 'Could not retrieve record.' });
    }
});

module.exports = router;