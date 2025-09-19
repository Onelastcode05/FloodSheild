const mongoose = require('mongoose');

const floodEventSchema = new mongoose.Schema({
    state: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    area: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    level: {
        type: Number,
        required: true,
        min: 0
    },
    impact: {
        type: String,
        required: true
    },
    affectedAreas: [{
        type: String
    }],
    casualties: {
        type: Number,
        default: 0
    },
    damage: {
        type: Number,
        default: 0
    },
    evacuationCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
floodEventSchema.index({ state: 1, city: 1, year: -1 });

module.exports = mongoose.model('FloodEvent', floodEventSchema); 