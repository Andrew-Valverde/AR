const express = require('express');
const { SignJWT, jwtVerify } = require('jose');
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();
const router = express.Router();

const secretString = process.env.JWT_KEY || '6c7c5ebddf6230c39ddd0b12d2facb272977d45939cbae51528f69426d339b58';
const secretKey = new TextEncoder().encode(secretString);

router.post('/register', async (req, res) => {
    const { name, lastName, userName, email, password } = req.body;

    if (!name || !lastName || !userName || !email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const existing = await prisma.users.findFirst({
            where: { OR: [{ email }, { userName }] }
        });

        if (existing) {
            return res.status(409).json({ error: "Email or username already in use." });
        }

        const hashedPassword = await argon2.hash(password);

        const user = await prisma.users.create({
            data: { name, lastName, userName, email, password: hashedPassword }
        });

        const { password: _, ...safeUser } = user;

        const token = await new SignJWT({ userId: user.id })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secretKey);

        console.log(`New user registered: ${email}`);
        res.status(201).json({ token, user: safeUser });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Could not complete registration." });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    console.log(`Login attempt for: ${email}`);

    try {
        const user = await prisma.users.findFirst({ where: { email } });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const passwordMatch = await argon2.verify(user.password, password);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const { password: _, ...safeUser } = user;

        const token = await new SignJWT({ userId: user.id })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secretKey);

        console.log(`User logged in: ${email}`);
        res.json({ token, user: safeUser });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Could not complete login." });
    }
});

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(403).json({ error: "Access denied. No token provided." });

    try {
        const { payload } = await jwtVerify(token, secretKey);
        req.user = payload;
        next();
    } catch (error) {
        console.error("Token verification failed:", error.code || error.message);
        res.status(401).json({ error: "Invalid or expired token." });
    }
};

router.get('/me', verifyToken, async (req, res) => {
    try {
        console.log(`Fetching profile for user ID: ${req.user.userId}`);

        const user = await prisma.users.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                name: true,
                lastName: true,
                userName: true,
                email: true,
                createdAt: true,
            }
        });

        if (!user) return res.status(404).json({ error: "User not found." });

        res.json(user);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});


router.post('/logout', verifyToken, (req, res) => {
    console.log(`User logged out: ${req.user.userId}`);
    res.json({ message: "Logged out successfully." });
});

module.exports = { router, verifyToken };