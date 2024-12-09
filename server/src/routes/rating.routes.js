const express = require('express');
const router = express.Router();
const Rating = require('../models//ratingModel.js');

// Create a new rating
router.post('/', async (req, res) => {
    try {
        const rating = new Rating(req.body);
        await rating.save();
        res.status(201).json(rating);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all ratings for a painting
router.get('/painting/:paintingId', async (req, res) => {
    try {
        const ratings = await Rating.find({ paintingId: req.params.paintingId });
        res.status(200).json(ratings);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all ratings by a user
router.get('/user/:userId', async (req, res) => {
    try {
        const ratings = await Rating.find({ userId: req.params.userId });
        res.status(200).json(ratings);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
