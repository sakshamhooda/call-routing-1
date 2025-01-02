/**
 * Metrics Utility Implementation
 * Based on the paper's specifications in Section 4
 */

class MetricsUtility {
    /**
     * Calculate classification metrics
     * @param {Object} confusionMatrix - Confusion matrix values
     * @returns {Object} - Classification metrics
     */
    calculateClassificationMetrics(confusionMatrix) {
        const { truePositives, trueNegatives, falsePositives, falseNegatives } = confusionMatrix;
        
        // Calculate accuracy
        const accuracy = (truePositives + trueNegatives) / 
            (truePositives + trueNegatives + falsePositives + falseNegatives);

        // Calculate precision
        const precision = truePositives / (truePositives + falsePositives);

        // Calculate recall
        const recall = truePositives / (truePositives + falseNegatives);

        // Calculate F1 score
        const f1Score = 2 * (precision * recall) / (precision + recall);

        // Calculate Equal Error Rate (EER)
        const far = falsePositives / (falsePositives + trueNegatives);
        const frr = falseNegatives / (falseNegatives + truePositives);
        const eer = (far + frr) / 2;

        return {
            accuracy,
            precision,
            recall,
            f1Score,
            eer
        };
    }

    /**
     * Calculate call routing framework metrics
     * @param {Object} data - Framework performance data
     * @returns {Object} - Framework metrics
     */
    calculateFrameworkMetrics(data) {
        // Calculate reduction in spoofing incidents
        const reductionRate = data.incidentsPost && data.incidentsPre ?
            ((1 - (data.incidentsPost / data.incidentsPre)) * 100) : null;

        // Calculate call success rate
        const callSuccessRate = data.successfulCalls && data.totalCalls ?
            ((data.successfulCalls / data.totalCalls) * 100) : null;

        // Calculate fraud detection rate
        const fraudDetectionRate = data.detectedFraudulentCalls && data.totalFraudulentCalls ?
            ((data.detectedFraudulentCalls / data.totalFraudulentCalls) * 100) : null;

        // Calculate system latency
        const totalLatency = (data.processingLatency || 0) + 
                           (data.networkLatency || 0) + 
                           (data.verificationLatency || 0);

        return {
            reductionRate,
            callSuccessRate,
            fraudDetectionRate,
            totalLatency
        };
    }

    /**
     * Calculate user satisfaction score
     * @param {Array} ratings - Array of user ratings and weights
     * @returns {number} - Calculated satisfaction score
     */
    calculateUserSatisfactionScore(ratings) {
        if (!ratings || !ratings.length) return 0;

        const weightedSum = ratings.reduce((sum, rating) => {
            return sum + (rating.score * (rating.weight || 1));
        }, 0);

        const totalWeight = ratings.reduce((sum, rating) => {
            return sum + (rating.weight || 1);
        }, 0);

        return weightedSum / totalWeight;
    }

    /**
     * Calculate Voice Spoofing-Specific Metrics
     * @param {Object} data - Voice spoofing detection data
     * @returns {Object} - Voice spoofing metrics
     */
    calculateVoiceSpoofingMetrics(data) {
        // Calculate tandem Detection Cost Function (t-DCF)
        const tDCF = (data.cMiss * data.piTarget * data.pMiss) +
                    (data.cFa * data.piNonTarget * data.pFa);

        // Calculate Spoofing Recognition Rate (SRR)
        const srr = data.correctlySpoofed / data.totalSpoofing;

        // Calculate Log-Likelihood Ratio Cost (LLRC)
        const llrc = -Math.log2(data.pGenuine);

        return {
            tDCF,
            srr,
            llrc
        };
    }

    /**
     * Calculate Vision Transformer Metrics
     * @param {Object} data - Vision transformer performance data
     * @returns {Object} - Vision transformer metrics
     */
    calculateVisionTransformerMetrics(data) {
        // Calculate Attention Distance
        const attentionDistance = data.attentionScores.reduce((sum, score, i) => {
            return sum + (score * data.distances[i]);
        }, 0) / data.numHeads;

        // Calculate Cross-Attention Consistency
        const crossAttentionConsistency = data.attentionLayers.reduce((sum, layer, i, arr) => {
            if (i === arr.length - 1) return sum;
            const cosine = this.calculateCosineSimiliarity(layer, arr[i + 1]);
            return sum + cosine;
        }, 0) / (data.attentionLayers.length - 1);

        // Calculate Patch Coverage Rate
        const patchCoverageRate = (data.attendedPatches / data.totalPatches) * 100;

        return {
            attentionDistance,
            crossAttentionConsistency,
            patchCoverageRate
        };
    }

    /**
     * Helper function to calculate cosine similarity
     * @param {Array} a - First vector
     * @param {Array} b - Second vector
     * @returns {number} - Cosine similarity
     */
    calculateCosineSimiliarity(a, b) {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }

    /**
     * Generate comprehensive performance report
     * @param {Object} allMetrics - All collected metrics
     * @returns {Object} - Comprehensive report
     */
    generatePerformanceReport(allMetrics) {
        return {
            timestamp: new Date(),
            classification: this.calculateClassificationMetrics(allMetrics.confusionMatrix),
            framework: this.calculateFrameworkMetrics(allMetrics.frameworkData),
            userSatisfaction: this.calculateUserSatisfactionScore(allMetrics.userRatings),
            voiceSpoofing: this.calculateVoiceSpoofingMetrics(allMetrics.voiceData),
            visionTransformer: this.calculateVisionTransformerMetrics(allMetrics.visionData),
            recommendations: this.generateRecommendations(allMetrics)
        };
    }

    /**
     * Generate system recommendations based on metrics
     * @param {Object} metrics - All system metrics
     * @returns {Array} - List of recommendations
     */
    generateRecommendations(metrics) {
        const recommendations = [];
        const thresholds = {
            accuracy: 0.95,
            latency: 100,
            fraudDetection: 0.9,
            userSatisfaction: 4.0
        };

        // Check each metric against thresholds and generate recommendations
        if (metrics.classification.accuracy < thresholds.accuracy) {
            recommendations.push({
                type: 'accuracy_improvement',
                priority: 'high',
                suggestion: 'Consider retraining the classification model with more recent data'
            });
        }

        if (metrics.framework.totalLatency > thresholds.latency) {
            recommendations.push({
                type: 'latency_optimization',
                priority: 'medium',
                suggestion: 'Optimize network routing or upgrade infrastructure'
            });
        }

        return recommendations;
    }
}

module.exports = MetricsUtility;