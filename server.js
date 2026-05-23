// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
const port = process.env.PORT || 3000;
import 'dotenv/config'

const app = express();

app.use(cors());
app.use(express.json());

try {
    if (!process.env.MONGO_URI) {
        console.log("MONGO_URI is missing!");
        return;
    }
    await mongoose.connect(process.env.MONGO_URI)

    console.log('Connected to mongoDB!');

} catch (err) {
    console.log(err);
}

const UserSchema = new mongoose.Schema({
    name: String
});

const User = mongoose.model('User', UserSchema);

// await User.create({ name: 'Tom' });

app.get('/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})