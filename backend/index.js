require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const AIEngine    = require('./ai/AIEngine');
const DataManager = require('./manager/DataManager');

const { router: authRouter } = require('./routes/auth');
const usersRouter     = require('./routes/users');
const analyzerRouter  = require('./routes/analyzer');
const chatRouter      = require('./routes/chat');
const knowledgeRouter = require('./routes/knowledge');

const app  = express();
const PORT = process.env.PORT || 3312;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

const aiEngine   = new AIEngine(process.env.GEMINI_API_KEY);
aiEngine.init();

const dataManager = new DataManager(aiEngine);

app.use((req, _res, next) => {
    req.aiEngine    = aiEngine;
    req.dataManager = dataManager;
    next();
});

app.use('/api/auth',      authRouter);
app.use('/api/users',     usersRouter);
app.use('/api/analyzer',  analyzerRouter);
app.use('/api/chat',      chatRouter);
app.use('/api/knowledge', knowledgeRouter);

app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
