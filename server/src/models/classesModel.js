const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    // Optionally you can add fields like max number of students, instructor, etc.
});

module.exports = mongoose.model('Class', ClassSchema);
