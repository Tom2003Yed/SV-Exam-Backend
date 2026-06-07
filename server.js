import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
const port = process.env.PORT || 3000;
import 'dotenv/config'
import { generateText } from 'ai';

const app = express();

app.use(cors());
app.use(express.json());

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

await Movie.create({
    title: 'Matrix',
    genre: 'action',
    description: 'good movie'
});


// לבדוק אם יעבוד לי הורסל אחרי שאני מוחק את הבלוק הזה ומזיז את הכורס בשורה 13 לפה במקום הבלוק הזה
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173, https://sv-exam-frontend-a9fc0kq1s-tom2003yeds-projects.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

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


// מחזיר סרטים שהכותרת שלהם כוללת את הערך שנשלח.
app.get('/movies/search', async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: "Missing name query parameter" });
    }

    const movies = await Movie.find({ title: name }); 
    
    res.json(movies);
});

app.post('/chat', async (req, res) => {
    try {
        // תיקון: שינוי ל-req.body.message כדי שיתאים בול ל-React
        const context = req.body.message;
        console.log("context: ", context);

        // הגנה קטנה כדי למנוע קריסה של ה-API במקרה ונשלח טקסט ריק
        if (!context) {
            return res.status(400).send("Missing message in body");
        }

        // קריאה ל-Claude באמצעות Vercel AI SDK
        const { text } = await generateText({
            model: "google/gemini-2.5-flash",
            prompt: `answer the question: ${context}`,
        });

        // החזרת התשובה ישירות לפרונטאנד
        res.send(text);

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).send("Error generating response from AI");
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})