const express = require('express');
const router = express.Router();
const Class = require('../models/classesModel.js');

// Create a new class
router.post('/', async (req, res) => {
    try {
        const newClass = new Class(req.body);
        await newClass.save();
        res.status(201).json(newClass);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all classes
router.get('/', async (req, res) => {
    try {
        const classes = await Class.find();
        res.status(200).json(classes);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update a class
router.put('/:id', async (req, res) => {
    try {
        const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedClass) return res.status(404).json({ message: 'Class not found' });
        res.status(200).json(updatedClass);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete a class
router.delete('/:id', async (req, res) => {
    try {
        const deletedClass = await Class.findByIdAndDelete(req.params.id);
        if (!deletedClass) return res.status(404).json({ message: 'Class not found' });
        res.status(200).json({ message: 'Class deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
