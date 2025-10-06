// server.js (Node.js/Express) - Moksha AI Secure Proxy

// 1. IMPORTS & SETUP
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';

// Initialize Express App (Must be done first!)
const app = express(); 

// Define the port from the environment variable (Render's setting)
const port = process.env.PORT || 3000; 

// --- Middleware (Needs 'app' to be defined) ---
// Allows the website (frontend) to talk to the server
app.use(cors()); 
// Allows the server to correctly read the JSON body (the 'prompt' and 'systemInstruction')
app.use(express.json()); 

// 2. AI CLIENT INITIALIZATION
// Load the key securely from Render's environment variable (GEMINI_API_KEY)
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set.");
    // In a real server, you might exit here: process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// 3. CORE ROUTE DEFINITION (Needs 'app' to be defined)
app.post('/chat', async (req, res) => {
    try {
        const { prompt, systemInstruction } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: "Missing 'prompt' in request body." });
        }

        // Create the chat session with the AI's core instructions
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: systemInstruction, 
            },
        });

        // *** THE FIX: The prompt is wrapped in an array [prompt]
        const result = await chat.sendMessage([prompt]); 

        // Send the final text response back to the website
        res.json({ text: result.text });

    } catch (error) {
        console.error("Gemini API or Server Error:", error);
        res.status(500).json({ error: "Internal Server Error. Please check Render Logs for details." });
    }
});

// 4. SERVER LISTEN (Must be done last)
app.listen(port, () => {
    console.log(`Moksha AI Proxy Server listening on port ${port}`);
});
