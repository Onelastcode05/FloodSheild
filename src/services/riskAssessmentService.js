const config = require('../../config/config');
const logger = require('../utils/logger');

class RiskAssessmentService {
    /**
     * Assess flood risk based on rainfall and river level data
     * @param {number} rainfall24h - Total rainfall in last 24 hours (mm)
     * @param {number} riverLevel - Current river level (meters)
     * @returns {Object} Risk assessment result
     */
    assessRisk(rainfall24h, riverLevel = null) {
        const riskLevels = {
            rainfall: this._assessRainfallRisk(rainfall24h),
            riverLevel: riverLevel ? this._assessRiverLevelRisk(riverLevel) : null
        };

        // Determine overall risk level
        const overallRisk = this._calculateOverallRisk(riskLevels);

        return {
            riskLevel: overallRisk,
            details: riskLevels,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Assess risk level based on rainfall
     * @private
     */
    _assessRainfallRisk(rainfall) {
        if (rainfall >= config.thresholds.rainfall24h.high) {
            return 'High';
        } else if (rainfall >= config.thresholds.rainfall24h.medium) {
            return 'Medium';
        } else if (rainfall >= config.thresholds.rainfall24h.low) {
            return 'Low';
        }
        return 'Minimal';
    }

    /**
     * Assess risk level based on river level
     * @private
     */
    _assessRiverLevelRisk(level) {
        if (level >= config.thresholds.riverLevel.high) {
            return 'High';
        } else if (level >= config.thresholds.riverLevel.medium) {
            return 'Medium';
        } else if (level >= config.thresholds.riverLevel.low) {
            return 'Low';
        }
        return 'Minimal';
    }

    /**
     * Calculate overall risk level
     * @private
     */
    _calculateOverallRisk(riskLevels) {
        const riskValues = {
            'High': 3,
            'Medium': 2,
            'Low': 1,
            'Minimal': 0
        };

        // If we have both rainfall and river level data
        if (riskLevels.riverLevel) {
            const maxRisk = Math.max(
                riskValues[riskLevels.rainfall],
                riskValues[riskLevels.riverLevel]
            );
            return Object.keys(riskValues).find(key => riskValues[key] === maxRisk);
        }

        // If we only have rainfall data
        return riskLevels.rainfall;
    }
}

module.exports = new RiskAssessmentService(); 