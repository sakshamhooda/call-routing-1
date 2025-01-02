/**
 * Anomaly Detection System Implementation
 * Based on the paper's specifications in Section 3.4
 */

class AnomalyDetectionSystem {
    constructor() {
        this.baselineMetrics = new Map();
        this.anomalyThresholds = {
            callVolume: 0.3,    // 30% deviation from baseline
            duration: 0.25,     // 25% deviation from baseline
            failureRate: 0.2,   // 20% deviation from baseline
            latency: 0.15      // 15% deviation from baseline
        };
    }

    /**
     * Update baseline metrics
     * @param {string} metricName - Name of the metric
     * @param {Array} values - Historical values for the metric
     */
    updateBaseline(metricName, values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        this.baselineMetrics.set(metricName, {
            mean,
            stdDev,
            lastUpdated: Date.now()
        });
    }

    /**
     * Check if a value is anomalous
     * @param {string} metricName - Name of the metric
     * @param {number} value - Current value
     * @returns {Object} - Anomaly detection result
     */
    detectAnomaly(metricName, value) {
        const baseline = this.baselineMetrics.get(metricName);
        if (!baseline) {
            return { isAnomaly: false, reason: 'No baseline established' };
        }

        const threshold = this.anomalyThresholds[metricName] || 0.2;
        const deviation = Math.abs(value - baseline.mean) / baseline.mean;

        return {
            isAnomaly: deviation > threshold,
            deviation,
            threshold,
            baselineMean: baseline.mean,
            currentValue: value,
            timestamp: Date.now()
        };
    }

    /**
     * Process call metrics for anomaly detection
     * @param {Object} metrics - Call metrics
     * @returns {Array} - Detected anomalies
     */
    processCallMetrics(metrics) {
        const anomalies = [];

        // Check call volume
        if (metrics.callVolume) {
            const volumeAnomaly = this.detectAnomaly('callVolume', metrics.callVolume);
            if (volumeAnomaly.isAnomaly) {
                anomalies.push({
                    type: 'callVolume',
                    ...volumeAnomaly
                });
            }
        }

        // Check average call duration
        if (metrics.avgDuration) {
            const durationAnomaly = this.detectAnomaly('duration', metrics.avgDuration);
            if (durationAnomaly.isAnomaly) {
                anomalies.push({
                    type: 'duration',
                    ...durationAnomaly
                });
            }
        }

        // Check failure rate
        if (metrics.failureRate) {
            const failureAnomaly = this.detectAnomaly('failureRate', metrics.failureRate);
            if (failureAnomaly.isAnomaly) {
                anomalies.push({
                    type: 'failureRate',
                    ...failureAnomaly
                });
            }
        }

        return anomalies;
    }

    /**
     * Calculate risk score based on detected anomalies
     * @param {Array} anomalies - Detected anomalies
     * @returns {Object} - Risk assessment
     */
    calculateRiskScore(anomalies) {
        if (!anomalies.length) {
            return { score: 0, level: 'low' };
        }

        // Weight different types of anomalies
        const weights = {
            callVolume: 0.3,
            duration: 0.2,
            failureRate: 0.5
        };

        let totalScore = 0;
        for (const anomaly of anomalies) {
            const weight = weights[anomaly.type] || 0.2;
            totalScore += anomaly.deviation * weight;
        }

        // Normalize score to 0-1 range
        const normalizedScore = Math.min(1, totalScore);

        // Determine risk level
        let level;
        if (normalizedScore < 0.3) level = 'low';
        else if (normalizedScore < 0.7) level = 'medium';
        else level = 'high';

        return {
            score: normalizedScore,
            level,
            anomalyCount: anomalies.length,
            timestamp: Date.now()
        };
    }

    /**
     * Generate alerts based on anomalies
     * @param {Array} anomalies - Detected anomalies
     * @returns {Array} - Generated alerts
     */
    generateAlerts(anomalies) {
        return anomalies.map(anomaly => ({
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: `anomaly_${anomaly.type}`,
            severity: anomaly.deviation > 0.5 ? 'high' : 'medium',
            message: `Anomaly detected in ${anomaly.type}: ${(anomaly.deviation * 100).toFixed(2)}% deviation from baseline`,
            timestamp: Date.now(),
            metadata: {
                baselineValue: anomaly.baselineMean,
                currentValue: anomaly.currentValue,
                threshold: anomaly.threshold
            }
        }));
    }
}

module.exports = AnomalyDetectionSystem;