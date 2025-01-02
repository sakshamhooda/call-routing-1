/**
 * Encryption Utility Implementation
 * Handles secure communication and data encryption
 */

const crypto = require('crypto');

class EncryptionUtility {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 12;  // 96 bits for GCM
        this.tagLength = 16; // 128 bits for authentication tag
    }

    /**
     * Generate a new encryption key
     * @returns {Buffer} - Generated key
     */
    generateKey() {
        return crypto.randomBytes(this.keyLength);
    }

    /**
     * Generate initialization vector
     * @returns {Buffer} - Generated IV
     */
    generateIV() {
        return crypto.randomBytes(this.ivLength);
    }

    /**
     * Encrypt data using AES-256-GCM
     * @param {Buffer} key - Encryption key
     * @param {string|Buffer} data - Data to encrypt
     * @returns {Object} - Encrypted data with IV and auth tag
     */
    encrypt(key, data) {
        const iv = this.generateIV();
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        
        let encryptedData = cipher.update(data, 'utf8');
        encryptedData = Buffer.concat([encryptedData, cipher.final()]);
        
        return {
            encrypted: encryptedData,
            iv: iv,
            authTag: cipher.getAuthTag()
        };
    }

    /**
     * Decrypt data using AES-256-GCM
     * @param {Buffer} key - Decryption key
     * @param {Buffer} encryptedData - Data to decrypt
     * @param {Buffer} iv - Initialization vector
     * @param {Buffer} authTag - Authentication tag
     * @returns {string} - Decrypted data
     */
    decrypt(key, encryptedData, iv, authTag) {
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedData);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString('utf8');
    }

    /**
     * Generate a secure hash of data
     * @param {string|Buffer} data - Data to hash
     * @returns {string} - Generated hash
     */
    generateHash(data) {
        return crypto.createHash('sha256')
                    .update(data)
                    .digest('hex');
    }

    /**
     * Sign data using RSA
     * @param {string} privateKey - RSA private key
     * @param {string|Buffer} data - Data to sign
     * @returns {string} - Digital signature
     */
    sign(privateKey, data) {
        const signer = crypto.createSign('SHA256');
        signer.update(data);
        return signer.sign(privateKey, 'base64');
    }

    /**
     * Verify signature using RSA
     * @param {string} publicKey - RSA public key
     * @param {string|Buffer} data - Original data
     * @param {string} signature - Signature to verify
     * @returns {boolean} - Verification result
     */
    verify(publicKey, data, signature) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(data);
        return verifier.verify(publicKey, signature, 'base64');
    }

    /**
     * Generate a secure session key
     * @returns {Object} - Session key and ID
     */
    generateSessionKey() {
        return {
            id: crypto.randomBytes(16).toString('hex'),
            key: this.generateKey(),
            timestamp: Date.now(),
            expiresIn: 3600 // 1 hour in seconds
        };
    }

    /**
     * Encrypt data with session key
     * @param {Object} session - Session information
     * @param {string|Buffer} data - Data to encrypt
     * @returns {Object} - Encrypted data with session info
     */
    encryptWithSession(session, data) {
        const encrypted = this.encrypt(session.key, data);
        return {
            sessionId: session.id,
            ...encrypted,
            timestamp: Date.now()
        };
    }
}

module.exports = EncryptionUtility;