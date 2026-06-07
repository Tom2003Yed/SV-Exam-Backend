import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import 'dotenv/config'
import { generateText } from 'ai';

const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());

process.env.AI_API_KEY ||= process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
if (!process.env.AI_API_KEY) {
    console.warn('AI_API_KEY / AI_GATEWAY_API_KEY is missing! AI-powered description generation will fail.');
}

try {
    if (!process.env.MONGO_URI) {
        console.log("MONGO_URI is missing!");
    }
    await mongoose.connect(process.env.MONGO_URI)

    console.log('Connected to mongoDB!');

} catch (err) {
    console.log(err);
}

const MovieSchema = new mongoose.Schema({
    title: String,
    genre: String,
    description: String
});

const Movie = mongoose.model('Movie', MovieSchema);

// await Movie.create({
//     title: 'Matrix',
//     genre: 'action',
//     description: 'good movie'
// });
app.use(cors());

app.get('/movies', async (req, res) => {
    const movies = await Movie.find();
    res.json(movies);
})

app.put('/movies/:id', async (req, res) => {
    const { id } = req.params;
    const { title, genre, description } = req.body;
    const movie = await Movie.findByIdAndUpdate(
        id,
        { title, genre, description },
        { new: true }
    );
    res.json(movie);
})

app.post('/movies', async (req, res) => {
    const { title, genre, description } = req.body;
    const movie = await Movie.create({ title, genre, description });
    res.json(movie);
})

app.delete('/movies/:id', async (req, res) => {
    const { id } = req.params;
    const movie = await Movie.findByIdAndDelete(id);
    res.json(movie);
})


app.get('/movies/search', async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: "Missing name query parameter" });
    }

    const movies = await Movie.find({ title: name });

    res.json(movies);
});

app.post('/movies/generate', async (req, res) => {
    try {
        const { title, genre } = req.body;

        if (!title || !genre) {
            return res.status(400).json({ error: "Missing title or genre in body" });
        }

        const { text } = await generateText({
            model: "google/gemini-2.5-flash",
            prompt: `Write a short movie description (max 200 characters) for a movie with the title "${title}" and genre "${genre}".\n` +
                `Return ONLY valid JSON in this exact format, no other text:\n` +
                `{"description": "your description here"}`,
            temperature: 0.2,
        });

        const responseText = (text ?? '').trim();
        let description = '';

        if (responseText) {
            try {
                const parsed = JSON.parse(responseText);
                description = parsed.description;
            } catch (err) {
                const match = responseText.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        const parsed = JSON.parse(match[0]);
                        description = parsed.description;
                    } catch {
                        description = responseText;
                    }
                } else {
                    description = responseText;
                }
            }
        }

        if (!description) {
            throw new Error('Unable to parse AI response');
        }

        res.json({ description: description.slice(0, 200) });

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Error generating response from AI" });
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})