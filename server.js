// server.js (The Secure Proxy Server)
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';

// 1. Read API Key securely from the Render Environment Variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('FATAL: GEMINI_API_KEY environment variable is not set.');
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware to allow ALL origins (temporarily for Render deployment)
// THIS IS THE CRITICAL FIX: The strict rule was blocking Render's health check.
app.use(cors()); 

app.use(express.json({ limit: '10mb' })); // Allow large requests (for files)

// Initialize AI client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Moksha AI Proxy Server is running securely and listening for /chat requests.');
});

// POST endpoint for the chat
app.post('/chat', async (req, res) => {
    try {
        // We receive the user's question and the system rules from the front-end
        const { contents, systemInstruction } = req.body;

        if (!contents || contents.length === 0) {
            return res.status(400).send({ error: "Missing 'contents' in request body." });
        }

        // Use the AI with the secret key (ONLY on the server)
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        // Send ONLY the AI's response text back to the GitHub Page
        res.json({ text: response.text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).send({ error: "An error occurred while communicating with the AI server." });
    }
});

// 3. Start the Server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
