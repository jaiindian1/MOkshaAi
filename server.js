// server.js (Node.js/Express) - Moksha AI Secure Proxy

// 1. IMPORTS & SETUP

// CRITICAL FIX: This is the correct ES Module way to load the .env file.
// This single line replaces the old 'require' method and prevents the ReferenceError.
import 'dotenv/config'; 

// Import all other packages using ES Module syntax
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors'; 

// Initialize Express App
const app = express();

// Define the port from the environment variable (Render/local .env) or default to 3000
const port = process.env.PORT || 3000; 

// ----------------------------------------------------------------------
// --- Middleware ---

// Allows the website (frontend) to talk to the server
app.use(cors()); 

// Allows the server to correctly read the JSON body (the 'prompt' and 'systemInstruction')
app.use(express.json()); 

// ----------------------------------------------------------------------
// 2. AI CLIENT INITIALIZATION

// Load the key securely from the environment variable
const apiKey = process.env.GEMINI_API_KEY;

// Crucial: Check for the key and stop if it's missing (industry standard)
if (!apiKey) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set. Please create a .env file or set it in your hosting environment.");
    // Exit the process so the server doesn't start without credentials
    process.exit(1); 
}

const ai = new GoogleGenAI({ apiKey });

// ----------------------------------------------------------------------
// 3. CORE ROUTE DEFINITION (POST /chat)

app.post('/chat', async (req, res) => {
    try {
        // Get the prompt and the optional system instruction from the request body
        const { prompt, systemInstruction } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: "Missing 'prompt' in request body." });
        }

        // Configuration object for the chat session.
        const chatConfig = {};
        if (systemInstruction) {
            // Add the System Instruction to the chat configuration
            chatConfig.systemInstruction = systemInstruction;
        }

        // Create the chat session. A new session for each request ensures 
        // the system instruction is applied to the very first prompt.
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: chatConfig,
        });

        // Send the prompt message to the chat session.
        const result = await chat.sendMessage({ message: prompt }); 

        // Send the final text response back to the website
        res.json({ text: result.text });

    } catch (error) {
        console.error("Gemini API or Server Error:", error);
        // For security and cleanliness, only send a generic error to the client
        res.status(500).json({ error: "Internal Server Error. Please check server logs for details." });
    }
});

// ----------------------------------------------------------------------
// 4. SERVER LISTEN 
app.listen(port, () => {
    console.log(`\n🤖 Moksha AI Proxy Server is running!`);
    console.log(`🌍 Listening on port ${port} (http://localhost:${port})`);
});
