require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');

const AIEngine    = require('./ai/AIEngine');
const DataManager = require('./manager/DataManager');

const { router: authRouter } = require('./routes/auth');
const usersRouter     = require('./routes/users');
const analyzerRouter  = require('./routes/analyzer');
const chatRouter      = require('./routes/chat');
const knowledgeRouter = require('./routes/knowledge');

const app  = express();
const PORT = process.env.PORT || 3312;

app.use(cors());
app.use(express.json());

// ─── Init AI services ─────────────────────────────────────────────────────────
const aiEngine   = new AIEngine(process.env.GEMINI_API_KEY);
aiEngine.init();

const dataManager = new DataManager(aiEngine);

// ─── Dependency injection middleware ─────────────────────────────────────────
// Makes aiEngine and dataManager available on every request without global state.
app.use((req, _res, next) => {
    req.aiEngine    = aiEngine;
    req.dataManager = dataManager;
    next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRouter);
app.use('/api/users',     usersRouter);
app.use('/api/analyzer',  analyzerRouter);
app.use('/api/chat',      chatRouter);
app.use('/api/knowledge', knowledgeRouter);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
