const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const paintingsRoutes = require('./routes/paintings');
const ratingsRoutes = require('./routes/ratings');
const classesRoutes = require('./routes/classes'); // Add this line

dotenv.config();

const app = express();

//! CONFIGURE
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/paintings', paintingsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/classes', classesRoutes);

module.exports = app;
