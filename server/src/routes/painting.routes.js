const express = require('express');
const router = express.Router();
const Painting = require('../models/Painting');

// Create a new painting
router.post('/', async (req, res) => {
    try {
        const painting = new Painting(req.body);
        await painting.save();
        res.status(201).json(painting);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all paintings
router.get('/', async (req, res) => {
    try {
        const paintings = await Painting.find();
        res.status(200).json(paintings);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update a painting
router.put('/:id', async (req, res) => {
    try {
        const painting = await Painting.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!painting) return res.status(404).json({ message: 'Painting not found' });
        res.status(200).json(painting);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete a painting
router.delete('/:id', async (req, res) => {
    try {
        const painting = await Painting.findByIdAndDelete(req.params.id);
        if (!painting) return res.status(404).json({ message: 'Painting not found' });
        res.status(200).json({ message: 'Painting deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
