import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Only import once

dotenv.config();

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        // Using Cohere's API endpoint and your API key from environment variables
        const response = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.COHERE_API_KEY}`, // Use your Cohere API key here
            },
            body: JSON.stringify({
                model: 'command-xlarge-nightly', // Cohere model name (check documentation for available models)
                prompt: prompt,
                max_tokens: 100, // Adjust as needed
                temperature: 0.7, // Adjust creativity (0 to 1)
            }),
        });

        const data = await response.json();

        // Check if the response from Cohere contains the text
        if (!data || !data.generations || !data.generations[0].text) {
            console.error("Unexpected API response:", data);
            return res.status(500).json({ error: "Invalid response from Cohere API" });
        }

        // Send the response content back to the client
        const responseText = data.generations[0].text.trim();
        res.json({ response: responseText });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "An error occurred on the server" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
