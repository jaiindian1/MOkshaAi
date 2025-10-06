// server.js (Node.js/Express) - Moksha AI Secure Proxy
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';

// Initialize Express App
const app = express();
// Render tells us which port to use via the environment variable
const port = process.env.PORT || 3000; 

// --- Middleware ---
// Allows the website (GitHub Pages) to talk to the server (Render)
app.use(cors()); 
// CRITICAL: This allows the server to correctly read the JSON body (the 'prompt' and 'systemInstruction')
app.use(express.json()); 

// --- Google AI Client Initialization ---
// The key is securely loaded from Render's environment variable (GEMINI_API_KEY)
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set.");
    // The server cannot run without the secret key.
}

const ai = new GoogleGenAI({ apiKey });

// --- Core Proxy Route: The final, correct recipe ---
app.post('/chat', async (req, res) => {
    try {
        // 1. Get the correct ingredients (prompt and systemInstruction) from the website's delivery
        const { prompt, systemInstruction } = req.body;
        
        if (!prompt) {
            // If the key ingredient is missing, send the 400 error back
            return res.status(400).json({ error: "Missing 'prompt' in request body." });
        }

        // 2. Create the chat session with the AI's core instructions
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: systemInstruction, 
            },
        });

        // 3. Send the message to the real Gemini API
        // *** FINAL FIX IS HERE: Sending 'prompt' directly as required by the API
        const result = await chat.sendMessage(prompt);

        // 4. Send the final text response back to the website
        res.json({ text: result.text });

    } catch (error) {
        console.error("Gemini API or Server Error:", error);
        // If anything else breaks (e.g., bad API key, wrong format), send a general error
        res.status(500).json({ error: "Internal Server Error. Please check Render Logs for details." });
    }
});

// --- Server Start ---
app.listen(port, () => {
    console.log(`Moksha AI Proxy Server listening on port ${port}`);
});
