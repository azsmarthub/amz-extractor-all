// Enhanced Webhook Manager for AMZ Extractor ALL
// Supports both Basic and Enhanced payload modes with Basic Auth

class WebhookManager {
    
    // Default webhook configuration
    static DEFAULT_CONFIG = {
        url: 'https://n8n.azsmarthub.com/webhook/amz-extractor-all',
        username: 'amzextractor',
        password: 'UFjSooyolve8zjF2mn7Q',
        mode: 'enhanced' // 'basic' or 'enhanced'
    };
    
    // ============= AUTHENTICATION =============
    
    static createBasicAuthHeader(username, password) {
        return 'Basic ' + btoa(username + ':' + password);
    }
    
    static async getConfig() {
        try {
            if (typeof window !== 'undefined' && window.StorageManager) {
                return await window.StorageManager.getWebhookConfig();
            } else if (typeof chrome !== 'undefined') {
                const data = await chrome.storage.local.get({ webhook_settings: {} });
                return data.webhook_settings;
            }
            return this.DEFAULT_CONFIG;
        } catch (error) {
            console.error('Failed to get webhook config:', error);
            return this.DEFAULT_CONFIG;
        }
    }
    
    static async setConfig(config) {
        try {
            const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
            
            if (typeof window !== 'undefined' && window.StorageManager) {
                await window.StorageManager.setWebhookConfig(mergedConfig);
            } else if (typeof chrome !== 'undefined') {
                await chrome.storage.local.set({ webhook_settings: mergedConfig });
            }
            
            console.log('Webhook config saved successfully');
            return { success: true };
        } catch (error) {
            console.error('Failed to save webhook config:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ============= REQUEST BUILDING =============
    
    static buildHeaders(username, password) {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'AMZ-Extractor-ALL/1.0.0'
        };
        
        if (username && password) {
            headers['Authorization'] = this.createBasicAuthHeader(username, password);
        }
        
        return headers;
    }
    
    static validateUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }
    
    // ============= PAYLOAD BUILDERS =============
    
    static async buildBasicPayload() {
        if (typeof window !== 'undefined' && window.StorageManager) {
            return await window.StorageManager.buildBasicPayload();
        }
        
        // Fallback for background script context
        const data = await chrome.storage.local.get(['asinList', 'amazon_keywords']);
        const asinList = data.asinList || [];
        const keywords = data.amazon_keywords || '';
        
        const classified = {
            top3: asinList.slice(0, 3),
            others: asinList.slice(3)
        };
        
        return {
            amazon_keywords: keywords,
            asin_top3: classified.top3.map(item => item.asin).join(','),
            asin_list: classified.others.map(item => item.asin).join(',')
        };
    }
    
    static async buildEnhancedPayload() {
        if (typeof window !== 'undefined' && window.StorageManager) {
            return await window.StorageManager.buildEnhancedPayload();
        }
        
        // Fallback for background script context
        const [basicPayload, extractorResults] = await Promise.all([
            this.buildBasicPayload(),
            chrome.storage.local.get('extractorResults').then(data => data.extractorResults || {})
        ]);
        
        return {
            source: "amz-extractor-all",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            
            // Original ASIN data
            ...basicPayload,
            
            // Enhanced extraction data
            extraction_data: {
                images: extractorResults.images || [],
                processed_products: extractorResults.productData || [],
                product_strategy: extractorResults.processedAnalysis?.product_strategy || {},
                content_ready_packages: extractorResults.processedAnalysis?.content_ready_packages || {}
            }
        };
    }
    
    // ============= CORE SENDING FUNCTIONS =============
    
    static async sendRequest(url, payload, username, password) {
        if (!this.validateUrl(url)) {
            throw new Error('Invalid webhook URL');
        }
        
        const headers = this.buildHeaders(username, password);
        
        console.log('Sending webhook request:', {
            url,
            username,
            hasPassword: !!password,
            payloadSize: JSON.stringify(payload).length
        });
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        
        console.log('Webhook response:', response.status, response.statusText);
        
        const responseText = await response.text();
        
        return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            response: responseText,
            headers: Object.fromEntries(response.headers.entries())
        };
    }
    
    static async sendBasic(customConfig = null) {
        const config = customConfig || await this.getConfig();
        const payload = await this.buildBasicPayload();
        
        return await this.sendRequest(
            config.url,
            payload,
            config.username,
            config.password
        );
    }
    
    static async sendEnhanced(customConfig = null) {
        const config = customConfig || await this.getConfig();
        const payload = await this.buildEnhancedPayload();
        
        return await this.sendRequest(
            config.url,
            payload,
            config.username,
            config.password
        );
    }
    
    static async send(mode = 'enhanced', customConfig = null) {
        if (mode === 'basic') {
            return await this.sendBasic(customConfig);
        } else {
            return await this.sendEnhanced(customConfig);
        }
    }
    
    // ============= TEST FUNCTIONS =============
    
    static async testConnection(url = null, username = null, password = null) {
        const config = await this.getConfig();
        
        const testUrl = url || config.url || this.DEFAULT_CONFIG.url;
        const testUsername = username || config.username || this.DEFAULT_CONFIG.username;
        const testPassword = password || config.password || this.DEFAULT_CONFIG.password;
        
        if (!this.validateUrl(testUrl)) {
            throw new Error('Invalid webhook URL format');
        }
        
        const testPayload = {
            test: true,
            timestamp: new Date().toISOString(),
            source: 'amz-extractor-all-test',
            version: '1.0.0',
            message: 'Test connection from AMZ Extractor ALL'
        };
        
        return await this.sendRequest(testUrl, testPayload, testUsername, testPassword);
    }
    
    // ============= UTILITY FUNCTIONS =============
    
    static formatHeaders(username, password) {
        const headers = this.buildHeaders(username, password);
        
        // Mask the authorization header for display
        if (headers.Authorization) {
            headers.Authorization = 'Basic ' + '•'.repeat(16);
        }
        
        return headers;
    }
    
    static async getPayloadPreview(mode = 'enhanced') {
        try {
            if (mode === 'basic') {
                return await this.buildBasicPayload();
            } else {
                return await this.buildEnhancedPayload();
            }
        } catch (error) {
            console.error('Failed to build payload preview:', error);
            return { error: error.message };
        }
    }
    
    static async validatePayload(mode = 'enhanced') {
        try {
            const payload = await this.getPayloadPreview(mode);
            
            if (payload.error) {
                return { valid: false, error: payload.error };
            }
            
            const size = JSON.stringify(payload).length;
            const hasRequiredFields = mode === 'basic' ? 
                payload.amazon_keywords !== undefined && payload.asin_top3 !== undefined :
                payload.source && payload.extraction_data;
            
            return {
                valid: hasRequiredFields,
                size: size,
                sizeKB: Math.round(size / 1024),
                fields: Object.keys(payload).length,
                mode: mode
            };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    // ============= BATCH OPERATIONS =============
    
    static async sendBatch(payloads, config = null) {
        const webhookConfig = config || await this.getConfig();
        const results = [];
        
        for (let i = 0; i < payloads.length; i++) {
            try {
                const result = await this.sendRequest(
                    webhookConfig.url,
                    payloads[i],
                    webhookConfig.username,
                    webhookConfig.password
                );
                
                results.push({
                    index: i,
                    success: result.success,
                    status: result.status,
                    response: result.response
                });
                
                // Small delay between requests
                if (i < payloads.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                results.push({
                    index: i,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }
}

// Export for different environments
if (typeof window !== 'undefined') {
    window.WebhookManager = WebhookManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookManager;
}

// Backwards compatibility (for existing code)
if (typeof window !== 'undefined') {
    window.WebhookUtils = {
        testWebhook: (url, username, password) => WebhookManager.testConnection(url, username, password),
        sendData: (url, username, password, results) => {
            // Convert old format to new
            const payload = {
                source: 'amz-extractor-all',
                timestamp: new Date().toISOString(),
                extraction_data: { images: results }
            };
            return WebhookManager.sendRequest(url, payload, username, password);
        },
        validateUrl: WebhookManager.validateUrl,
        formatHeaders: WebhookManager.formatHeaders,
        createBasicAuthHeader: WebhookManager.createBasicAuthHeader
    };
}