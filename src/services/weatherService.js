const axios = require('axios');
const config = require('../../config/config');
const logger = require('../utils/logger');

class WeatherService {
    constructor() {
        this.apiKey = config.weatherApi.apiKey;
        this.baseUrl = config.weatherApi.baseUrl;
    }

    /**
     * Fetch current weather data for a location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} Current weather data
     */
    async getCurrentWeather(lat, lon) {
        try {
            const response = await axios.get(`${this.baseUrl}/weather`, {
                params: {
                    lat,
                    lon,
                    appid: this.apiKey,
                    units: config.weatherApi.units
                }
            });
            return response.data;
        } catch (error) {
            logger.error('Error fetching current weather:', error.message);
            throw error;
        }
    }

    /**
     * Fetch historical weather data for the past 24 hours
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} Historical weather data
     */
    async getHistoricalWeather(lat, lon) {
        try {
            // Note: This requires a paid OpenWeatherMap API subscription
            const response = await axios.get(`${this.baseUrl}/onecall/timemachine`, {
                params: {
                    lat,
                    lon,
                    appid: this.apiKey,
                    units: config.weatherApi.units
                }
            });
            return response.data;
        } catch (error) {
            logger.error('Error fetching historical weather:', error.message);
            throw error;
        }
    }

    /**
     * Calculate total rainfall in the past 24 hours
     * @param {Array} hourlyData - Array of hourly weather data
     * @returns {number} Total rainfall in mm
     */
    calculate24HourRainfall(hourlyData) {
        return hourlyData.reduce((total, hour) => {
            return total + (hour.rain ? hour.rain['1h'] || 0 : 0);
        }, 0);
    }
}

module.exports = new WeatherService(); 