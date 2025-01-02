/**
 * System Configuration
 */

module.exports = {
    analytics: {
        elasticsearchUrl: 'http://localhost:9200',
        retentionPeriod: '30d',
        indexPrefix: 'call_routing_'
    },
    security: {
        tokenExpiration: '1h',
        maxLoginAttempts: 3,
        sessionTimeout: 3600,
        minPasswordLength: 12
    },
    routing: {
        maxRetries: 3,
        timeoutMs: 5000,
        maxConcurrentCalls: 1000,
        loadBalancingStrategy: 'round-robin'
    },
    monitoring: {
        metricsInterval: 60000, // 1 minute
        alertThreshold: 0.8,
        retentionDays: 90,
        debugLevel: 'info'
    },
    authentication: {
        stirShaken: {
            certValidityDays: 30,
            minAttestationLevel: 'B',
            verificationTimeout: 2000
        },
        mfa: {
            otpValiditySeconds: 300,
            backupCodesCount: 10,
            maxDevices: 3
        }
    }
};