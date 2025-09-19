const express = require('express');
const router = express.Router();
const axios = require('axios');
const FloodEvent = require('../models/FloodEvent');
const AreaCharacteristic = require('../models/AreaCharacteristic');

// NASA POWER API configuration
const NASA_POWER_API = 'https://power.larc.nasa.gov/api/temporal/daily/point';

// Real-time river level thresholds (in m³/s)
const RIVER_THRESHOLDS = {
    'Ganga': {
        low: 10000,
        moderate: 12000,
        high: 14000,
        severe: 15000
    },
    'Brahmaputra': {
        low: 12000,
        moderate: 14000,
        high: 16000,
        severe: 20000
    },
    'Yamuna': {
        low: 2000,
        moderate: 3000,
        high: 4000,
        severe: 5000
    },
    'Godavari': {
        low: 3000,
        moderate: 4000,
        high: 5000,
        severe: 6000
    }
};

// Get flood prediction data for a location
router.get('/location/:state/:city', async (req, res) => {
    try {
        const { state, city } = req.params;
        
        // Fetch historical flood events from database
        const historicalEvents = await FloodEvent.find({ 
            state, 
            city 
        })
        .sort({ year: -1, month: -1 })
        .limit(5)
        .select('year month level impact affectedAreas casualties damage evacuationCount');
        
        // Fetch area characteristics from database (use first match for state/city)
        const areaCharacteristics = await AreaCharacteristic.findOne({ 
            state, 
            city
        });

        if (!areaCharacteristics) {
            return res.status(404).json({ 
                error: 'Area characteristics not found',
                message: 'No data available for this state/city'
            });
        }

        // Get the most recent flood event
        const mostRecentEvent = historicalEvents[0];
        if (!mostRecentEvent) {
            return res.status(404).json({
                error: 'No historical data found',
                message: 'No flood events recorded for this state/city'
            });
        }

        // Get current date and calculate date range (last 10 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 10);

        // Format dates for NASA API (YYYYMMDD)
        const formatDate = (date) => {
            return date.toISOString().slice(0, 10).replace(/-/g, '');
        };

        // Fetch soil moisture data from NASA POWER API
        const soilMoistureData = await axios.get(NASA_POWER_API, {
            params: {
                parameters: 'SOILWET1',
                start: formatDate(startDate),
                end: formatDate(endDate),
                latitude: areaCharacteristics.coordinates.latitude,
                longitude: areaCharacteristics.coordinates.longitude,
                format: 'JSON'
            }
        });

        // Calculate current values based on historical data and area characteristics
        const currentLevel = calculateCurrentLevel(historicalEvents, areaCharacteristics);
        const dangerLevel = calculateDangerLevel(historicalEvents, areaCharacteristics);
        const rainfall = calculateRainfall(historicalEvents, areaCharacteristics);
        
        // Calculate soil moisture from NASA data
        const soilMoisture = calculateSoilMoistureFromNASA(soilMoistureData.data);
        
        const basinCapacity = calculateBasinCapacity(historicalEvents, areaCharacteristics);

        // Calculate flood risk based on real-time data
        const floodRisk = calculateFloodRisk(
            currentLevel,
            rainfall,
            soilMoisture,
            basinCapacity,
            areaCharacteristics
        );

        // Generate risk assessment report
        const riskAssessment = generateRiskAssessment(floodRisk, areaCharacteristics);

        // Combine all data
        const floodData = {
            currentLevel,
            dangerLevel,
            rainfall,
            soilMoisture,
            basinCapacity,
            historicalEvents,
            characteristics: formatAreaCharacteristics(areaCharacteristics),
            floodRisk,
            riskAssessment
        };

        res.json(floodData);
    } catch (error) {
        console.error('Error fetching flood prediction data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch flood prediction data',
            message: error.message 
        });
    }
});

// Calculate flood risk based on multiple factors
function calculateFloodRisk(currentLevel, rainfall, soilMoisture, basinCapacity, characteristics) {
    const riverName = characteristics.riverBasin;
    const thresholds = RIVER_THRESHOLDS[riverName] || RIVER_THRESHOLDS['Ganga'];

    // Calculate risk score (0-100)
    let riskScore = 0;
    
    // River level risk (40% weight)
    const levelRisk = calculateLevelRisk(currentLevel, thresholds);
    riskScore += levelRisk * 0.4;
    
    // Rainfall risk (20% weight)
    const rainfallRisk = calculateRainfallRisk(rainfall);
    riskScore += rainfallRisk * 0.2;
    
    // Soil moisture risk (20% weight)
    const moistureRisk = calculateMoistureRisk(soilMoisture);
    riskScore += moistureRisk * 0.2;
    
    // Basin capacity risk (20% weight)
    const capacityRisk = calculateCapacityRisk(basinCapacity);
    riskScore += capacityRisk * 0.2;

    // Determine risk level
    let riskLevel;
    if (riskScore >= 80) {
        riskLevel = 'severe';
    } else if (riskScore >= 60) {
        riskLevel = 'high';
    } else if (riskScore >= 40) {
        riskLevel = 'moderate';
    } else {
        riskLevel = 'low';
    }

    return {
        score: Math.round(riskScore),
        level: riskLevel,
        factors: {
            levelRisk,
            rainfallRisk,
            moistureRisk,
            capacityRisk
        }
    };
}

// Calculate risk based on river level
function calculateLevelRisk(currentLevel, thresholds) {
    if (currentLevel >= thresholds.severe) return 100;
    if (currentLevel >= thresholds.high) return 80;
    if (currentLevel >= thresholds.moderate) return 60;
    if (currentLevel >= thresholds.low) return 40;
    return 20;
}

// Calculate risk based on rainfall
function calculateRainfallRisk(rainfall) {
    const { current, threshold } = rainfall;
    const ratio = current / threshold;
    
    if (ratio >= 1.5) return 100;
    if (ratio >= 1.2) return 80;
    if (ratio >= 1.0) return 60;
    if (ratio >= 0.8) return 40;
    return 20;
}

// Calculate risk based on soil moisture
function calculateMoistureRisk(soilMoisture) {
    const { current, threshold } = soilMoisture;
    const ratio = current / threshold;
    
    if (ratio >= 0.95) return 100;
    if (ratio >= 0.9) return 80;
    if (ratio >= 0.85) return 60;
    if (ratio >= 0.8) return 40;
    return 20;
}

// Calculate risk based on basin capacity
function calculateCapacityRisk(basinCapacity) {
    const { current, threshold } = basinCapacity;
    const ratio = current / threshold;
    
    if (ratio <= 0.5) return 100;
    if (ratio <= 0.6) return 80;
    if (ratio <= 0.7) return 60;
    if (ratio <= 0.8) return 40;
    return 20;
}

// Generate detailed risk assessment report
function generateRiskAssessment(floodRisk, characteristics) {
    const { score, level, factors } = floodRisk;
    
    // Generate recommendations based on risk level
    const recommendations = generateRecommendations(level, factors, characteristics);
    
    // Generate evacuation zones if risk is high or severe
    const evacuationZones = level === 'high' || level === 'severe' 
        ? generateEvacuationZones(characteristics)
        : null;

    return {
        summary: `Current flood risk is ${level.toUpperCase()} (${score}/100)`,
        details: {
            levelRisk: `River level risk: ${factors.levelRisk}/100`,
            rainfallRisk: `Rainfall risk: ${factors.rainfallRisk}/100`,
            moistureRisk: `Soil moisture risk: ${factors.moistureRisk}/100`,
            capacityRisk: `Basin capacity risk: ${factors.capacityRisk}/100`
        },
        recommendations,
        evacuationZones
    };
}

// Generate recommendations based on risk level and factors
function generateRecommendations(riskLevel, factors, characteristics) {
    const recommendations = [];
    
    // Base recommendations on risk level
    if (riskLevel === 'severe') {
        recommendations.push('Immediate evacuation recommended');
        recommendations.push('Emergency services on high alert');
    } else if (riskLevel === 'high') {
        recommendations.push('Prepare for possible evacuation');
        recommendations.push('Monitor river levels closely');
    } else if (riskLevel === 'moderate') {
        recommendations.push('Stay alert for changing conditions');
        recommendations.push('Review evacuation plans');
    } else {
        recommendations.push('Monitor weather forecasts');
        recommendations.push('Maintain normal activities with caution');
    }
    
    // Add specific recommendations based on risk factors
    if (factors.levelRisk >= 80) {
        recommendations.push('River levels approaching critical threshold');
    }
    if (factors.rainfallRisk >= 80) {
        recommendations.push('Heavy rainfall expected - prepare for flash floods');
    }
    if (factors.moistureRisk >= 80) {
        recommendations.push('High soil moisture - increased flood risk');
    }
    if (factors.capacityRisk >= 80) {
        recommendations.push('Basin capacity critical - prepare for overflow');
    }
    
    return recommendations;
}

// Generate evacuation zones based on area characteristics
function generateEvacuationZones(characteristics) {
    const zones = [];
    const { elevation, distanceFromRiver, urbanDevelopment } = characteristics;
    
    // Zone 1: Immediate danger (within 1km of river, low elevation)
    if (distanceFromRiver.value <= 1 && elevation.value <= 10) {
        zones.push({
            level: 1,
            description: 'Immediate evacuation required',
            areas: ['Riverside settlements', 'Low-lying areas']
        });
    }
    
    // Zone 2: High risk (1-3km from river, moderate elevation)
    if (distanceFromRiver.value <= 3 && elevation.value <= 20) {
        zones.push({
            level: 2,
            description: 'Prepare for evacuation',
            areas: ['Suburban areas', 'Agricultural land']
        });
    }
    
    // Zone 3: Moderate risk (3-5km from river, higher elevation)
    if (distanceFromRiver.value <= 5) {
        zones.push({
            level: 3,
            description: 'Monitor situation',
            areas: ['Urban areas', 'Higher ground']
        });
    }
    
    return zones;
}

// Helper functions
function calculateCurrentLevel(historicalEvents, areaCharacteristics) {
    const recentEvents = historicalEvents.slice(0, 3);
    const avgLevel = recentEvents.reduce((sum, event) => sum + event.level, 0) / recentEvents.length;
    
    const drainageFactor = {
        'Poor': 1.1,
        'Moderate': 1.0,
        'Good': 0.9,
        'Excellent': 0.8
    }[areaCharacteristics.drainageSystem];

    // Convert from m³/s to meters (divide by 10000)
    return Math.round((avgLevel * drainageFactor) / 10000);
}

function calculateDangerLevel(historicalEvents, areaCharacteristics) {
    const maxLevel = Math.max(...historicalEvents.map(event => event.level));
    
    const riskFactor = areaCharacteristics.floodProne ? 1.2 : 1.1;
    const urbanFactor = {
        'Low': 1.0,
        'Medium': 1.1,
        'High': 1.2
    }[areaCharacteristics.urbanDevelopment];

    // Convert from m³/s to meters (divide by 10000)
    return Math.round((maxLevel * riskFactor * urbanFactor) / 10000);
}

function calculateRainfall(historicalEvents, areaCharacteristics) {
    const avgRainfall = historicalEvents.reduce((sum, event) => {
        return sum + (event.level / 1000);
    }, 0) / historicalEvents.length;

    const vegetationFactor = 1 - (areaCharacteristics.vegetationCover.value / 200);

    return {
        current: Math.round(avgRainfall * vegetationFactor),
        threshold: Math.round(avgRainfall * 1.5)
    };
}

function calculateSoilMoistureFromNASA(nasaData) {
    try {
        // Extract soil moisture values from NASA data
        const soilMoistureValues = nasaData.properties.parameter.SOILWET1;
        
        // Calculate average soil moisture
        const values = Object.values(soilMoistureValues);
        const avgMoisture = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        // Get the most recent value
        const currentMoisture = values[values.length - 1];
        
        // Calculate threshold based on historical data
        const threshold = Math.max(...values) * 1.1; // 10% higher than max observed

        return {
            current: Math.round(currentMoisture * 100), // Convert to percentage
            threshold: Math.round(threshold * 100),
            trend: calculateTrend(values)
        };
    } catch (error) {
        console.error('Error processing NASA soil moisture data:', error);
        return {
            current: 75, // Fallback value
            threshold: 90,
            trend: 'stable'
        };
    }
}

function calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recentValues = values.slice(-3);
    const differences = recentValues.slice(1).map((val, i) => val - recentValues[i]);
    const avgDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
    
    if (avgDifference > 0.1) return 'increasing';
    if (avgDifference < -0.1) return 'decreasing';
    return 'stable';
}

function calculateBasinCapacity(historicalEvents, areaCharacteristics) {
    const baseCapacity = historicalEvents.reduce((sum, event) => {
        return sum + (100 - (event.level / 1000));
    }, 0) / historicalEvents.length;

    const distanceFactor = 1 - (areaCharacteristics.distanceFromRiver.value / 10);
    const elevationFactor = 1 - (areaCharacteristics.elevation.value / 1000);

    return {
        current: Math.round(baseCapacity * (1 + distanceFactor + elevationFactor) / 3),
        threshold: 80
    };
}

function formatAreaCharacteristics(areaCharacteristics) {
    return [
        { name: 'Elevation', value: `${areaCharacteristics.elevation.value} ${areaCharacteristics.elevation.unit}` },
        { name: 'Distance from River', value: `${areaCharacteristics.distanceFromRiver.value} ${areaCharacteristics.distanceFromRiver.unit}` },
        { name: 'Drainage System', value: areaCharacteristics.drainageSystem },
        { name: 'Urban Development', value: areaCharacteristics.urbanDevelopment },
        { name: 'Population Density', value: `${areaCharacteristics.populationDensity.value} ${areaCharacteristics.populationDensity.unit}` },
        { name: 'Soil Type', value: areaCharacteristics.soilType },
        { name: 'Vegetation Cover', value: `${areaCharacteristics.vegetationCover.value} ${areaCharacteristics.vegetationCover.unit}` }
    ];
}

module.exports = router; 