const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // This loads the .env file

const app = express();
const port = process.env.PORT || 3000;

// A simple fix for CORS (Cross-Origin Resource Sharing) during development
// This allows your frontend (on a different 'origin') to talk to your backend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(bodyParser.json());

// Check if the API key is loaded
if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set in the .env file.");
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Create an API endpoint to handle chat requests
app.post('/api/chat', async (req, res) => {
    try {
        const { books, query } = req.body;

        if (!books || !query) {
            return res.status(400).send({ error: 'Missing books data or user query.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are a friendly, enthusiastic, deeply thoughtful, and reflective AI guide for the "Dr. Deas Book Log", a project tracking a journey to 1,000 books.
    You have been given access to the entire reading list.

    Your mission is to help visitors and friends discover interesting patterns and find great books within this collection.
    Analyze the book list to answer questions and provide insightful recommendations based on the themes present.

    When you speak, refer to the owner of the book log as "Dr. Deas".
    Address the person you are chatting with directly as "you".

    Here is the book data:
    ---
    ${books}
    ---

    Now, thoughtfully answer the user's question.

    User's question: "${query}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error('Error with AI chat:', error);
        res.status(500).send({ error: 'Error processing your request.' });
    }
});

app.listen(port, () => {
    console.log(`Backend server running successfully at http://localhost:${port}`);
});
