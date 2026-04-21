const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');

class DataManager {
    constructor(aiEngine) {
        this.prisma = new PrismaClient();
        this.ai = aiEngine;
    }

    _generateImageHash(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    }

    async processImage(filePath, mimeType) {
        const imageHash = this._generateImageHash(filePath);
        console.log(`Processing image with hash: ${imageHash}`);

        try {
            const cachedRecord = await this.prisma.imageAnalysis.findUnique({
                where: { imageHash: imageHash }
            });

            if (cachedRecord) {
                console.log("Cache hit! Returning objects data from database.");
                return JSON.parse(cachedRecord.objectsData);
            }

            console.log("Cache miss. Requesting AI analysis...");
            const aiResponseRaw = await this.ai.Analyze_Image(filePath, mimeType);
            
            if (!aiResponseRaw) throw new Error("AI failed to return valid JSON.");
            console.log("Saving new AI analysis to database...");
            await this.prisma.imageAnalysis.create({
                data: {
                    imageHash: imageHash,
                    objectsData: aiResponseRaw
                }
            });

            return JSON.parse(aiResponseRaw);

        } catch (error) {
            console.error("Error in DataManager:", error);
            throw error;
        }
    }
}

module.exports = DataManager;