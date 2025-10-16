// server.js (The Secure Proxy Server for Moksha AI)
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';

// 1. Read API Key securely from the Render Environment Variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('FATAL: GEMINI_API_KEY environment variable is not set.');
    // Exit the process if the key is missing to prevent security risks
    process.exit(1); 
}

const app = express();
// The server will use the port given by Render, or 3000 if running locally.
const port = process.env.PORT || 3000;

// ⭐ CRITICAL FIX: Middleware to allow ONLY your specific GitHub Page to talk to this server securely
// This fixes the security issue and the "cannot reach server" error.
app.use(cors({
    origin: 'https://jaiindian1.github.io/MOkshaAi', // <--- Your secure GitHub page URL
    methods: ['POST'], // <--- ONLY allows the chat function to work
}));

// Middleware to parse JSON bodies, allowing larger requests for file uploads
app.use(express.json({ limit: '10mb' })); 

// Initialize AI client using the secure environment variable
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Health check endpoint (Render uses this to check if the server is alive)
app.get('/', (req, res) => {
    // We confirm the server is running and ready for POST requests
    res.send('Moksha AI Proxy Server is running securely and listening for /chat POST requests.');
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
        // Log the full error to the Render logs for debugging
        console.error("Gemini API Error:", error); 
        res.status(500).send({ error: "An error occurred while communicating with the AI server." });
    }
});

// 3. Start the Server
// 🛑 CRITICAL FIX 2: We MUST specify '0.0.0.0' so the server listens on the correct network interface for Render.
app.listen(port, '0.0.0.0', () => {
    console.log(`Moksha AI Server listening on port ${port} on all interfaces.`);
});
