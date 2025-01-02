/**
 * Analytics System Implementation
 * Based on the paper's specifications in Section 3.4
 */

const { Client } = require('elasticsearch');

class AnalyticsSystem {
    constructor(config) {
        this.client = new Client({
            node: config.elasticsearchUrl || 'http://localhost:9200'
        });
        
        this.indices = {
            calls: 'calls',
            metrics: 'call_metrics',
            alerts: 'alerts'
        };
    }

    /**
     * Initialize required indices
     */
    async initializeIndices() {
        // Create indices with appropriate mappings
        await this.client.indices.create({
            index: this.indices.calls,
            body: {
                mappings: {
                    properties: {
                        timestamp: { type: 'date' },
                        callId: { type: 'keyword' },
                        source: { type: 'keyword' },
                        destination: { type: 'keyword' },
                        duration: { type: 'float' },
                        status: { type: 'keyword' },
                        route: { type: 'keyword' },
                        verificationStatus: { type: 'keyword' }
                    }
                }
            }
        });

        await this.client.indices.create({
            index: this.indices.metrics,
            body: {
                mappings: {
                    properties: {
                        timestamp: { type: 'date' },
                        metric: { type: 'keyword' },
                        value: { type: 'float' },
                        route: { type: 'keyword' }
                    }
                }
            }
        });
    }

    /**
     * Log call data
     * @param {Object} callData - Call information to log
     */
    async logCall(callData) {
        await this.client.index({
            index: this.indices.calls,
            body: {
                timestamp: new Date(),
                ...callData
            }
        });
    }

    /**
     * Calculate call success rate for a given time period
     * @param {string} timeRange - Time range for calculation
     * @returns {Promise<Object>} - Success rate metrics
     */
    async calculateSuccessRate(timeRange) {
        const response = await this.client.search({
            index: this.indices.calls,
            body: {
                query: {
                    range: {
                        timestamp: {
                            gte: `now-${timeRange}`
                        }
                    }
                },
                aggs: {
                    success_rate: {
                        terms: {
                            field: 'status'
                        }
                    }
                }
            }
        });

        const buckets = response.aggregations.success_rate.buckets;
        const total = buckets.reduce((sum, bucket) => sum + bucket.doc_count, 0);
        const successful = buckets.find(b => b.key === 'successful')?.doc_count || 0;

        return {
            successRate: (successful / total) * 100,
            totalCalls: total,
            successfulCalls: successful,
            timeRange
        };
    }

    /**
     * Get route performance metrics
     * @param {string} routeId - Route identifier
     * @param {string} timeRange - Time range for metrics
     * @returns {Promise<Object>} - Route performance metrics
     */
    async getRouteMetrics(routeId, timeRange) {
        const response = await this.client.search({
            index: this.indices.metrics,
            body: {
                query: {
                    bool: {
                        must: [
                            { term: { route: routeId } },
                            { range: { timestamp: { gte: `now-${timeRange}` } } }
                        ]
                    }
                },
                aggs: {
                    avg_latency: { avg: { field: 'latency' } },
                    avg_load: { avg: { field: 'load' } },
                    reliability: { avg: { field: 'reliability' } }
                }
            }
        });

        return {
            averageLatency: response.aggregations.avg_latency.value,
            averageLoad: response.aggregations.avg_load.value,
            reliability: response.aggregations.reliability.value,
            timeRange,
            routeId
        };
    }

    /**
     * Generate system health report
     * @returns {Promise<Object>} - System health metrics
     */
    async generateHealthReport() {
        const timeRanges = ['1h', '24h', '7d'];
        const metrics = {};

        for (const range of timeRanges) {
            metrics[range] = {
                successRate: await this.calculateSuccessRate(range),
                routeMetrics: await Promise.all(
                    ['route1', 'route2', 'route3'].map(
                        route => this.getRouteMetrics(route, range)
                    )
                )
            };
        }

        return {
            timestamp: new Date(),
            metrics,
            systemStatus: 'healthy', // Would be determined by actual metrics in production
            alerts: await this.getActiveAlerts()
        };
    }

    /**
     * Get active system alerts
     * @returns {Promise<Array>} - List of active alerts
     */
    async getActiveAlerts() {
        const response = await this.client.search({
            index: this.indices.alerts,
            body: {
                query: {
                    term: { status: 'active' }
                }
            }
        });

        return response.hits.hits.map(hit => hit._source);
    }

    /**
     * Calculate system KPIs
     * @returns {Promise<Object>} - System KPIs
     */
    async calculateKPIs() {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

        const response = await this.client.search({
            index: this.indices.calls,
            body: {
                query: {
                    range: {
                        timestamp: {
                            gte: twentyFourHoursAgo.toISOString()
                        }
                    }
                },
                aggs: {
                    avg_duration: { avg: { field: 'duration' } },
                    successful_calls: {
                        filter: { term: { status: 'successful' } }
                    },
                    verification_status: {
                        terms: { field: 'verificationStatus' }
                    }
                }
            }
        });

        return {
            averageCallDuration: response.aggregations.avg_duration.value,
            successfulCalls: response.aggregations.successful_calls.doc_count,
            verificationStats: response.aggregations.verification_status.buckets,
            timestamp: now
        };
    }
}

module.exports = AnalyticsSystem;