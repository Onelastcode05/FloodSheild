const mongoose = require('mongoose');
const FloodEvent = require('../models/FloodEvent');
const AreaCharacteristic = require('../models/AreaCharacteristic');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/floodshield', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sampleFloodEvents = [
    {
        state: 'bihar',
        city: 'patna',
        area: 'gandhi maidan',
        year: 2020,
        month: 8,
        level: 82000,
        impact: 'Major flooding in Gandhi Maidan',
        affectedAreas: ['Gandhi Maidan', 'Fraser Road', 'Exhibition Road'],
        casualties: 2,
        damage: 5000000,
        evacuationCount: 500
    },
    {
        state: 'bihar',
        city: 'patna',
        area: 'gandhi maidan',
        year: 2019,
        month: 7,
        level: 78000,
        impact: 'Moderate flooding in nearby areas',
        affectedAreas: ['Gandhi Maidan', 'Fraser Road'],
        casualties: 0,
        damage: 2000000,
        evacuationCount: 200
    },
    {
        state: 'bihar',
        city: 'patna',
        area: 'gandhi maidan',
        year: 2018,
        month: 9,
        level: 75000,
        impact: 'Minor flooding in low-lying areas',
        affectedAreas: ['Gandhi Maidan'],
        casualties: 0,
        damage: 1000000,
        evacuationCount: 100
    }
];

const sampleAreaCharacteristics = [
    {
        state: 'bihar',
        city: 'patna',
        area: 'gandhi maidan',
        elevation: {
            value: 53,
            unit: 'meters'
        },
        distanceFromRiver: {
            value: 1.2,
            unit: 'kilometers'
        },
        drainageSystem: 'Moderate',
        urbanDevelopment: 'High',
        populationDensity: {
            value: 15000,
            unit: 'per square km'
        },
        soilType: 'Alluvial',
        vegetationCover: {
            value: 15,
            unit: 'percent'
        },
        floodProne: true
    }
];

async function initializeDatabase() {
    try {
        // Clear existing data
        await FloodEvent.deleteMany({});
        await AreaCharacteristic.deleteMany({});

        // Insert sample data
        await FloodEvent.insertMany(sampleFloodEvents);
        await AreaCharacteristic.insertMany(sampleAreaCharacteristics);

        console.log('Database initialized successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        mongoose.connection.close();
    }
}

initializeDatabase(); 