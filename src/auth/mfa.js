/**
 * Multi-Factor Authentication Implementation
 * Based on the paper's specifications in Section 3.3.2
 */

const crypto = require('crypto');

class MultiFactorAuth {
    constructor() {
        this.otpSecrets = new Map();
        this.verificationAttempts = new Map();
        this.MAX_ATTEMPTS = 3;
        this.OTP_VALIDITY = 300000; // 5 minutes in milliseconds
    }

    /**
     * Generate a new TOTP secret for a user
     * @param {string} userId - User identifier
     * @returns {string} - Generated secret
     */
    generateTOTPSecret(userId) {
        const secret = crypto.randomBytes(20).toString('hex');
        this.otpSecrets.set(userId, {
            secret,
            createdAt: Date.now()
        });
        return secret;
    }

    /**
     * Generate TOTP based on secret and current time
     * @param {string} secret - TOTP secret
     * @returns {string} - Generated TOTP
     */
    generateTOTP(secret) {
        const time = Math.floor(Date.now() / 30000); // 30-second window
        const timeHex = Buffer.from(time.toString(16).padStart(16, '0'), 'hex');
        
        const hmac = crypto.createHmac('sha1', secret);
        hmac.update(timeHex);
        const hash = hmac.digest();

        const offset = hash[hash.length - 1] & 0xf;
        const binary = ((hash[offset] & 0x7f) << 24) |
                      ((hash[offset + 1] & 0xff) << 16) |
                      ((hash[offset + 2] & 0xff) << 8) |
                      (hash[offset + 3] & 0xff);

        const otp = (binary % 1000000).toString().padStart(6, '0');
        return otp;
    }

    /**
     * Verify TOTP code
     * @param {string} userId - User identifier
     * @param {string} code - TOTP code to verify
     * @returns {boolean} - Verification result
     */
    verifyTOTP(userId, code) {
        const secretData = this.otpSecrets.get(userId);
        if (!secretData) return false;

        const attempts = this.verificationAttempts.get(userId) || 0;
        if (attempts >= this.MAX_ATTEMPTS) {
            return false;
        }

        const expectedCode = this.generateTOTP(secretData.secret);
        const isValid = code === expectedCode;

        if (!isValid) {
            this.verificationAttempts.set(userId, attempts + 1);
        } else {
            this.verificationAttempts.delete(userId);
        }

        return isValid;
    }

    /**
     * Analyze user behavior for risk assessment
     * @param {Object} userBehavior - User behavior data
     * @returns {Object} - Risk assessment result
     */
    analyzeBehaviorRisk(userBehavior) {
        const riskFactors = {
            unusualTime: false,
            unusualLocation: false,
            suspiciousPattern: false,
            riskScore: 0
        };

        // Check for unusual time
        const hour = new Date().getHours();
        if (hour < 6 || hour > 22) {
            riskFactors.unusualTime = true;
            riskFactors.riskScore += 0.3;
        }

        // Check for unusual location
        if (userBehavior.location) {
            const isKnownLocation = this.isKnownLocation(userBehavior.location);
            if (!isKnownLocation) {
                riskFactors.unusualLocation = true;
                riskFactors.riskScore += 0.4;
            }
        }

        // Check for suspicious patterns
        if (userBehavior.recentAttempts > 5) {
            riskFactors.suspiciousPattern = true;
            riskFactors.riskScore += 0.3;
        }

        return riskFactors;
    }

    /**
     * Check if location is known/trusted
     * @param {Object} location - Location data
     * @returns {boolean} - Whether location is known
     */
    isKnownLocation(location) {
        // In production, would check against database of known locations
        // For prototype, using simplified check
        return Math.random() > 0.2; // 80% chance of known location
    }

    /**
     * Perform complete multi-factor authentication
     * @param {Object} authRequest - Authentication request
     * @returns {Promise<Object>} - Authentication result
     */
    async authenticate(authRequest) {
        const { userId, totpCode, behaviorData } = authRequest;
        
        // Step 1: Verify TOTP
        const isValidTOTP = this.verifyTOTP(userId, totpCode);
        if (!isValidTOTP) {
            return {
                success: false,
                error: 'INVALID_TOTP',
                requiresAdditionalVerification: false
            };
        }

        // Step 2: Analyze behavior risk
        const riskAssessment = this.analyzeBehaviorRisk(behaviorData);
        
        // Step 3: Determine if additional verification is needed
        const requiresAdditionalVerification = riskAssessment.riskScore >= 0.7;

        return {
            success: true,
            riskAssessment,
            requiresAdditionalVerification
        };
    }
}

module.exports = MultiFactorAuth;