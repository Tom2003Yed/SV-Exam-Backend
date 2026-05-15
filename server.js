// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
const port = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

try {
    await mongoose.connect('mongodb+srv://tomyed44_db_user:4pdHXmQd4qiCmZOC@cluster0.oboss3s.mongodb.net/bubu?appName=Cluster0')

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