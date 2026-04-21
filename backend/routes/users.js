const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();
const argon2 = require('argon2');

router.get("/", async (req, res) =>{
    try{
        console.log("Fetching all users from database....");
        const users = prisma.usuarios.findMany();
        res.json(users)
    }catch(err){
        console.error("Error fetching users:", err);
        res.status(500).json({ error: "Internal server error while fetching users." });
    }
})

module.exports = router;
