const mongoose = require('mongoose');

const PaintingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
});

module.exports = mongoose.model('Painting', PaintingSchema);
