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
        // NOTE: A new chat session is created on every POST, which means 
        // it does *not* remember the previous turn. This is good for a simple proxy!
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: systemInstruction, 
            },
        });

        // 3. Send the message to the real Gemini API
        // *** THE FIX: Wrap the 'prompt' string in an array: [prompt]
        const result = await chat.sendMessage([prompt]); // <--- THIS is the change!

        // 4. Send the final text response back to the website
        res.json({ text: result.text });

    } catch (error) {
        console.error("Gemini API or Server Error:", error);
        // If anything else breaks (e.g., bad API key, wrong format), send a general error
        res.status(500).json({ error: "Internal Server Error. Please check Render Logs for details." });
    }
});
