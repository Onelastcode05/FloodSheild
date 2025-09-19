require('dotenv').config();

module.exports = {
    // OpenWeatherMap API configuration
    weatherApi: {
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        apiKey: process.env.OPENWEATHER_API_KEY,
        units: 'metric'
    },
    
    // Risk thresholds
    thresholds: {
        rainfall24h: {
            low: 50,    // mm
            medium: 100, // mm
            high: 150    // mm
        },
        riverLevel: {
            low: 2.0,    // meters
            medium: 3.0, // meters
            high: 4.0    // meters
        }
    },
    
    // Monitoring settings
    monitoring: {
        checkInterval: 3600000, // 1 hour in milliseconds
        locations: [
            {
                name: 'Mumbai',
                lat: 19.0760,
                lon: 72.8777
            }
            // Add more locations as needed
        ]
    }
}; 