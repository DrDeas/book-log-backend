const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MongoClient } = require('mongodb'); // Import MongoDB client
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// --- Database Setup ---
const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);
let interactionsCollection; // This will hold our database collection

async function connectToDb() {
    try {
        await client.connect();
        const database = client.db("BookLogChat"); // You can name your database
        interactionsCollection = database.collection("interactions");
        console.log("Successfully connected to the database.");
    } catch (error) {
        console.error("Failed to connect to the database", error);
        process.exit(1); // Exit if we can't connect to the DB
    }
}

connectToDb(); // Connect to the DB when the server starts
// ----------------------

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

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

    When you speak, refer to the owner of the book log as "Dr. Deas" (he/him).
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

        // --- Save the interaction to the database ---
        if (interactionsCollection) {
            await interactionsCollection.insertOne({
                userQuery: query,
                aiResponse: text,
                timestamp: new Date()
            });
        }
        // ------------------------------------------

        res.json({ reply: text });

    } catch (error) {
        console.error('Error with AI chat:', error);
        res.status(500).send({ error: 'Error processing your request.' });
    }
});

app.listen(port, () => {
    console.log(`Backend server running successfully at http://localhost:${port}`);
});
