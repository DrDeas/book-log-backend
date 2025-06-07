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
            You are a helpful and insightful AI reading assistant for a book logging application.
            Analyze the following list of books that a user has read, which is provided in CSV format.

            Here is the book data:
            ---
            ${books}
            ---

            Based on this data, please answer the user's following question. Be insightful and provide clear, well-structured answers.

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