// Common Utilities for AMZ Extractor ALL

class Utils {
    
    // ============= ASIN VALIDATION =============
    
    static validateASIN(asin) {
        if (!asin || typeof asin !== 'string') return false;
        return /^B[0-9A-Z]{9}$/.test(asin.trim());
    }
    
    static extractASINFromURL(url) {
        if (!url) return null;
        const match = url.match(/([A-Z0-9]{10})(?:[/?]|$)/i);
        return match ? match[1] : null;
    }
    
    static validateASINList(asins) {
        if (!Array.isArray(asins)) return { valid: false, error: 'Input must be an array' };
        
        const invalidASINs = asins.filter(asin => !this.validateASIN(asin));
        
        if (invalidASINs.length > 0) {
            return { 
                valid: false, 
                error: `Invalid ASINs: ${invalidASINs.join(', ')}` 
            };
        }
        
        if (asins.length === 0) {
            return { valid: false, error: 'No ASINs provided' };
        }
        
        if (asins.length > 10) {
            return { valid: false, error: 'Maximum 10 ASINs allowed' };
        }
        
        // Check for duplicates
        const uniqueASINs = [...new Set(asins)];
        if (uniqueASINs.length !== asins.length) {
            return { valid: false, error: 'Duplicate ASINs found' };
        }
        
        return { valid: true, asins: uniqueASINs };
    }
    
    static parseASINInput(input) {
        if (!input || typeof input !== 'string') return [];
        
        // Support both comma and line-separated input
        const asins = input.split(/[,\n\r]+/)
            .map(asin => asin.trim())
            .filter(asin => asin.length > 0);
        
        return asins;
    }
    
    // ============= URL VALIDATION =============
    
    static validateURL(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }
    
    static isAmazonURL(url) {
        if (!this.validateURL(url)) return false;
        
        const amazonDomains = [
            'amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.com.au',
            'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es',
            'amazon.in', 'amazon.co.jp', 'amazon.com.mx', 'amazon.nl',
            'amazon.sg', 'amazon.ae', 'amazon.com.tr', 'amazon.se',
            'amazon.pl', 'amazon.sa', 'amazon.eg', 'amazon.com.be'
        ];
        
        try {
            const urlObj = new URL(url);
            return amazonDomains.some(domain => 
                urlObj.hostname === domain || urlObj.hostname === `www.${domain}`
            );
        } catch (error) {
            return false;
        }
    }
    
    static buildAmazonURL(asin, domain = 'amazon.com') {
        if (!this.validateASIN(asin)) {
            throw new Error('Invalid ASIN');
        }
        return `https://www.${domain}/dp/${asin}/`;
    }
    
    // ============= STRING UTILITIES =============
    
    static truncateText(text, maxLength = 50) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    static cleanText(text) {
        if (!text) return '';
        return text.replace(/\s+/g, ' ').trim();
    }
    
    static generateId(prefix = 'item', length = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = prefix + '_';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    static slugify(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .slice(0, 50);
    }
    
    // ============= ARRAY UTILITIES =============
    
    static chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    static removeDuplicates(array, key = null) {
        if (!key) {
            return [...new Set(array)];
        }
        
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }
    
    // ============= TIME & DATE UTILITIES =============
    
    static formatTimestamp(timestamp = null) {
        const date = timestamp ? new Date(timestamp) : new Date();
        return date.toISOString();
    }
    
    static getRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
    
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ============= ERROR HANDLING =============
    
    static createError(message, code = null, details = null) {
        const error = new Error(message);
        if (code) error.code = code;
        if (details) error.details = details;
        return error;
    }
    
    static handleAsyncError(promise) {
        return promise.catch(error => {
            console.error('Async operation failed:', error);
            return { success: false, error: error.message };
        });
    }
    
    static retry(fn, maxAttempts = 3, delay = 1000) {
        return new Promise(async (resolve, reject) => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const result = await fn();
                    resolve(result);
                    return;
                } catch (error) {
                    console.log(`Attempt ${attempt}/${maxAttempts} failed:`, error.message);
                    
                    if (attempt === maxAttempts) {
                        reject(error);
                        return;
                    }
                    
                    await this.sleep(delay * attempt);
                }
            }
        });
    }
    
    // ============= CLIPBOARD UTILITIES =============
    
    static async copyToClipboard(text) {
        try {
            // Method 1: Modern Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return { success: true, method: 'clipboard-api' };
            }
            
            // Method 2: execCommand fallback
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.opacity = '0';
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                return { success: true, method: 'execCommand' };
            }
            
            throw new Error('execCommand failed');
            
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ============= JSON UTILITIES =============
    
    static safeJSONParse(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('JSON parse failed:', error);
            return defaultValue;
        }
    }
    
    static safeJSONStringify(object, space = 2) {
        try {
            return JSON.stringify(object, null, space);
        } catch (error) {
            console.error('JSON stringify failed:', error);
            return '{}';
        }
    }
    
    static calculateJSONSize(object) {
        try {
            const jsonString = JSON.stringify(object);
            return {
                bytes: jsonString.length,
                kilobytes: Math.round(jsonString.length / 1024),
                megabytes: Math.round(jsonString.length / (1024 * 1024) * 100) / 100
            };
        } catch (error) {
            return { bytes: 0, kilobytes: 0, megabytes: 0 };
        }
    }
    
    // ============= EXTENSION UTILITIES =============
    
    static isExtensionContext() {
        return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    }
    
    static getExtensionURL(path) {
        if (!this.isExtensionContext()) return path;
        return chrome.runtime.getURL(path);
    }
    
    static sendMessage(message) {
        if (!this.isExtensionContext()) {
            console.warn('Not in extension context');
            return Promise.resolve(null);
        }
        
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Message sending failed:', chrome.runtime.lastError);
                    resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    resolve(response);
                }
            });
        });
    }
    
    // ============= VALIDATION UTILITIES =============
    
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static validatePassword(password, minLength = 8) {
        if (!password || password.length < minLength) {
            return { valid: false, error: `Password must be at least ${minLength} characters` };
        }
        return { valid: true };
    }
    
    static sanitizeInput(input, maxLength = 1000) {
        if (!input) return '';
        
        return input
            .toString()
            .slice(0, maxLength)
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/[<>]/g, '');
    }
}

// Export for different environments
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}