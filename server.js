import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Only import once
import cors from 'cors'; 

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());

app.use(bodyParser.json());

// Text generation endpoint (unchanged)
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const response = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'command-xlarge-nightly',
                prompt: prompt,
                max_tokens: 100,
                temperature: 0.7,
            }),
        });

        const data = await response.json();
        if (!data || !data.generations || !data.generations[0].text) {
            console.error("Unexpected API response:", data);
            return res.status(500).json({ error: "Invalid response from Cohere API" });
        }

        const responseText = data.generations[0].text.trim();
        res.json({ response: responseText });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "An error occurred on the server" });
    }
});

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const encodedPrompt = encodeURIComponent(prompt);
        const width = 768;
        const height = 768;
        const seed = 42;
        const model = 'flux';

        const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}`;
        res.json({ imageUrl });
    } catch (error) {
        console.error("Error generating image:", error);
        res.status(500).json({ error: "Failed to generate image." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
