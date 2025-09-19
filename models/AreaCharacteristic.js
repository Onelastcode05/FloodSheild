const mongoose = require('mongoose');

const areaCharacteristicSchema = new mongoose.Schema({
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
    elevation: {
        value: Number,
        unit: {
            type: String,
            default: 'meters'
        }
    },
    distanceFromRiver: {
        value: Number,
        unit: {
            type: String,
            default: 'kilometers'
        }
    },
    drainageSystem: {
        type: String,
        enum: ['Poor', 'Moderate', 'Good', 'Excellent'],
        required: true
    },
    urbanDevelopment: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        required: true
    },
    populationDensity: {
        value: Number,
        unit: {
            type: String,
            default: 'per square km'
        }
    },
    soilType: {
        type: String,
        required: true
    },
    vegetationCover: {
        value: Number,
        unit: {
            type: String,
            default: 'percent'
        }
    },
    floodProne: {
        type: Boolean,
        default: false
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
areaCharacteristicSchema.index({ state: 1, city: 1, area: 1 }, { unique: true });

module.exports = mongoose.model('AreaCharacteristic', areaCharacteristicSchema); 