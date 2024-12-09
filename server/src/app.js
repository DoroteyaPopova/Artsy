const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes.js');
const paintingsRoutes = require('./routes/painting.routes.js');
const ratingsRoutes = require('./routes/rating.routes.js');
const classesRoutes = require('./routes/classes.routes.js');

dotenv.config();

const app = express();

mongoose.connect(process.env.MONGO_URI,)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));


app.use(express.json());
app.use(express.urlencoded({ extended: false }))

app.use('/api/auth', authRoutes);
app.use('/api/paintings', paintingsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/classes', classesRoutes);

module.exports = app;
