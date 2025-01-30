import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';
import fs from 'fs';
import csv from 'csv-parser';

//const express = require('express');
//const bodyParser = require('body-parser');
//const fs = require('fs');
// const csv = require('csv-parser');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


let badWords = [];

// Load profanity words from CSV
fs.createReadStream('Profanity_dataset/profanity_dataset_en.csv')
  .pipe(csv({ headers: false })) // Disable headers
  .on('data', (row) => {
    // Since the file doesn't have headers, the word is in the first column (row[0])
    const word = row[0].trim().toLowerCase();
    if (word) {
      badWords.push(word);
    }
  })
  .on('end', () => {
    console.log('Profanity dataset loaded successfully.');
    //console.log('Bad Words:', badWords);  // Log the list of bad words
  });

app.post('/api/validate-message', (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Invalid message' });
    }

    // Create a regex pattern to match each bad word exactly
    const regexPattern = new RegExp(`\\b(${badWords.join('|')})\\b`, 'i');  // 'i' flag for case-insensitivity

    const hasProfanity = regexPattern.test(message);  // Check if any word in message matches a bad word

    if (hasProfanity) {
        return res.json({ valid: false, message: 'Your input contains prohibited language.' });
    }

    res.json({ valid: true });
});


// Text generation endpoint
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
                prompt: prompt + "when the story is finished say 'The End'",
                max_tokens: 1000, // Increase to allow linger responses
                temperature: 0.7, // Adjust temperature for creativity
                stop_sequences: ["The End"], // Optional: Define stop sequences
            }),
        });        

        const data = await response.json();

        if (!data || !data.generations || !data.generations[0].text) {
            console.error("Unexpected API response:", data);
            return res.status(500).json({ error: "Invalid response from Cohere API" });
        }

        res.json({ response: data.generations[0].text.trim() });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "An error occurred on the server" });
    }
});

// Helper function to retry fetch
const retryFetch = async (url, options, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }
            console.error(`Attempt ${attempt} failed with status: ${response.status}`);
        } catch (error) {
            console.error(`Attempt ${attempt} failed with error:`, error);
        }
    }
    throw new Error(`All ${retries} attempts failed`);
};

let storyContext = {
    keyDetails: [], // Most important details
    recentPrompts: [] // Tracks recent prompts
};

// extract and update key details
const updateKeyDetails = (prompt) => {
    const importantDetails = prompt.match(/(?:[A-Z][^.!?]*?important[^.!?]*[.!?])/gi) || [];
    storyContext.keyDetails = [...storyContext.keyDetails, ...importantDetails].slice(-10); // Keep the last 10 details
};


app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        // Update story context with the new prompt
        storyContext.recentPrompts.push(prompt);
        if (storyContext.recentPrompts.length > 3) storyContext.recentPrompts.shift(); // Keep the last 3 prompts
        updateKeyDetails(prompt); // Extract and track key details

        // Combine all key details and recent prompts for context
        const cohesiveContext = [
            ...storyContext.keyDetails,
            ...storyContext.recentPrompts,
        ].join(". ");

        const textSummaryResponse = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'command-xlarge-nightly',
                prompt: `Given the following story context, summarize the key elements concisely to describe the current scene and setting (max 40 words):\n\n${cohesiveContext}\n\n.`,
                max_tokens: 100,
                temperature: 0.2, // avoid overly creative responses
                stop_sequences: ["\n"], // stop generation at the end of the first response
            }),
        });
        
        const summaryData = await textSummaryResponse.json();

        //console.log("----------------- DATA SUMMERY -----------------\n");
        //console.log(summaryData);

        if (!summaryData || !summaryData.generations || !summaryData.generations[0].text) {
            console.error("Unexpected summarization API response:", summaryData);
            return res.status(500).json({ error: "Failed to summarize story context." });
        }

        const sceneDescription = summaryData.generations[0].text.trim();

        // Add a consistent style description
        const styleDescription = "in a vibrant art style.";
        const fullPrompt = `${sceneDescription}. ${styleDescription}`;

        // Generate the image
        const encodedPrompt = encodeURIComponent(fullPrompt);
        const width = 768;
        const height = 768;
        const seed = Math.floor(Math.random() * 10000);
        const model = 'flux';

        //console.log(fullPrompt);

        const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}`;

        // Retry the fetch up to 3 times
        await retryFetch(imageUrl, { method: 'GET' }, 3);

        res.json({ imageUrl });
    } catch (error) {
        console.error("Error generating image:", error);
        res.status(500).json({ error: "Failed to generate image after multiple attempts." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
