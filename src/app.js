const weatherService = require('./services/weatherService');
const riskAssessmentService = require('./services/riskAssessmentService');
const config = require('../config/config');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

class FloodDetectionSystem {
    constructor() {
        this.isRunning = false;
    }

    /**
     * Start the flood detection system
     */
    async start() {
        if (this.isRunning) {
            logger.warn('Flood detection system is already running');
            return;
        }

        this.isRunning = true;
        logger.info('Starting flood detection system');

        // Initial check
        await this.checkAllLocations();

        // Set up periodic checks
        this.intervalId = setInterval(
            () => this.checkAllLocations(),
            config.monitoring.checkInterval
        );
    }

    /**
     * Stop the flood detection system
     */
    stop() {
        if (!this.isRunning) {
            logger.warn('Flood detection system is not running');
            return;
        }

        clearInterval(this.intervalId);
        this.isRunning = false;
        logger.info('Flood detection system stopped');
    }

    /**
     * Check flood risk for all configured locations
     */
    async checkAllLocations() {
        for (const location of config.monitoring.locations) {
            try {
                await this.checkLocation(location);
            } catch (error) {
                logger.error(`Error checking location ${location.name}: ${error.message}`);
            }
        }
    }

    /**
     * Check flood risk for a specific location
     */
    async checkLocation(location) {
        logger.info(`Checking flood risk for ${location.name}`);

        // Get current weather
        const currentWeather = await weatherService.getCurrentWeather(
            location.lat,
            location.lon
        );

        // Get historical weather
        const historicalWeather = await weatherService.getHistoricalWeather(
            location.lat,
            location.lon
        );

        // Calculate rainfall
        const rainfall24h = weatherService.calculate24HourRainfall(historicalWeather.hourly);

        // Assess risk
        const riskAssessment = riskAssessmentService.assessRisk(rainfall24h);

        // Log result
        logger.info(`Risk assessment for ${location.name}: ${riskAssessment.riskLevel}`);

        if (riskAssessment.riskLevel === 'High') {
            logger.warn(`HIGH FLOOD RISK detected in ${location.name}!`);
            // Here you can add code to send alerts (email, SMS, etc.)
        }

        return riskAssessment;
    }
}

// Add this to check database connection
mongoose.connection.on('connected', () => {
    console.log('✓ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('✗ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('✗ MongoDB disconnected');
});

module.exports = new FloodDetectionSystem(); 