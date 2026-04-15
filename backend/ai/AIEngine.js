const fs = require("fs");
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIEngine {
    constructor(apiKey) {
        if (!apiKey) {
            console.error("Critical Error: The Gemini API Key has not been set.");
        }

        this.status = "Idle";
        this.version = "gemini-1.5-flash";
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    init() {
        this.status = "Running";
        console.log("AI Engine initialized successfully.");
    }


    _fileToGenerativePart(filePath, mimeType) {
        return {
            inlineData: {
                data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
                mimeType
            },
        };
    }

    async Analyze_Image(filePath, mimeType) {
        try {
            console.log("Sending image to Gemini for object detection...");
            
            const prompt = `
                You are an AR / industrial scene analyst. The user message may include an image and optional metadata.
                
                Your task: infer a concise scan summary and 4 insight callouts that could plausibly be shown as floating labels on the image. For each callout, you must identify 4 specific buckets: 1) Main object, 2) What it is, 3) Slight historic info, and 4) "Algo mas" (extra detail/trivia).
                
                OUTPUT RULES (strict):
                1) Return exactly ONE JSON object. No markdown, no code fences, no text before or after the JSON.
                2) The JSON must match this shape and key names exactly:
                
                {
                  "id": "string",
                  "label": "string",
                  "description": "string",
                  "image": "string",
                  "insights": [
                    {
                      "id": "string",
                      "title": "string",
                      "detail": "string",
                      "tone": "info|success|warning",
                      "style": {
                         "top": "10%",
                         "left": "20%",
                         "maxWidth": "min(200px, 40vw)"
                      }
                    }
                  ]
                }
                
                3) Produce exactly 4 insights in the "insights" array (no more, no less).
                4) "tone" must be only one of: "info", "success", "warning". Do not use any other value.
                5) Spread the four "style" positions to different quadrants when possible (e.g. top-left, top-right, bottom-left, bottom-right) so labels do not overlap.
                6) Base titles and details on what is visible in the image. If something is uncertain, phrase conservatively (e.g. "appears", "likely") rather than inventing precise measurements unless the image clearly supports them.
                7) Do not include comments inside JSON. Do not use trailing commas. Use double quotes for all strings.
                
                If the user did not supply an image, return:
                {"error":"no_image"}
                as the entire response (still raw JSON only).
            `;
            
            const imagePart = this._fileToGenerativePart(filePath, mimeType);
            const model = this.genAI.getGenerativeModel({ model: this.version });
            
            const result = await model.generateContent([prompt, imagePart]);
            let textResult = result.response.text();
            
            textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
            
            console.log("Image analysis completed successfully.");
            return textResult;
        } catch (error) {
            console.error("Image Analysis failed:", error);
            return null;
        }
    }

    async Chat(userMessage, history = [], knowledgeContext = null) {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.version });

            const systemInstruction = `You are an expert AR industrial assistant. 
                You help operators understand objects detected in industrial scenes — providing safety tips, maintenance advice, historical context, and operational guidance.
                Always be concise and practical. Respond in the same language the user writes in.
                ${knowledgeContext ? `\nRelevant knowledge base context:\n${knowledgeContext}` : ''}`;

            const chat = model.startChat({
                history: history.map(turn => ({
                    role: turn.role,
                    parts: [{ text: turn.parts }]
                })),
                systemInstruction
            });

            const result = await chat.sendMessage(userMessage);
            const response = result.response.text();
            console.log("Chat response generated successfully.");
            return response;
        } catch (error) {
            console.error("Chat failed:", error);
            return null;
        }
    }
}

module.exports = AIEngine;