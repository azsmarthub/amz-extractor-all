// Unified Storage Manager for AMZ Extractor ALL
// Handles both ASIN Collection and Extraction data

class StorageManager {
    
    // ============= ASIN COLLECTION STORAGE (Existing) =============
    
    static async getASINList() {
        const data = await chrome.storage.local.get({ asinList: [] });
        return data.asinList;
    }
    
    static async setASINList(asinList) {
        await chrome.storage.local.set({ asinList });
    }
    
    static async addASIN(asinData) {
        const currentList = await this.getASINList();
        if (!currentList.some(item => item.asin === asinData.asin)) {
            currentList.push(asinData);
            await this.setASINList(currentList);
        }
    }
    
    static async removeASIN(asin) {
        const currentList = await this.getASINList();
        const filteredList = currentList.filter(item => item.asin !== asin);
        await this.setASINList(filteredList);
    }
    
    static async getKeywords() {
        const data = await chrome.storage.local.get({ amazon_keywords: '' });
        return data.amazon_keywords;
    }
    
    static async setKeywords(keywords) {
        await chrome.storage.local.set({ amazon_keywords: keywords });
    }
    
    static async classifyASINs() {
        const asinList = await this.getASINList();
        return {
            top3: asinList.slice(0, 3),
            others: asinList.slice(3)
        };
    }
    
    // ============= WEBHOOK CONFIGURATION =============
    
    static async getWebhookConfig() {
        const data = await chrome.storage.local.get({ webhook_settings: {} });
        return data.webhook_settings;
    }
    
    static async setWebhookConfig(config) {
        await chrome.storage.local.set({ webhook_settings: config });
    }
    
    // ============= EXTRACTION DATA STORAGE (New) =============
    
    static async getExtractionResults() {
        const data = await chrome.storage.local.get({ extractorResults: {} });
        return data.extractorResults;
    }
    
    static async setExtractionResults(results) {
        await chrome.storage.local.set({ 
            extractorResults: {
                ...results,
                timestamp: Date.now()
            }
        });
    }
    
    static async addImageResults(imageData) {
        const current = await this.getExtractionResults();
        const images = current.images || [];
        
        // Update or add image data for ASIN
        const existingIndex = images.findIndex(item => item.asin === imageData.asin);
        if (existingIndex >= 0) {
            images[existingIndex] = imageData;
        } else {
            images.push(imageData);
        }
        
        await this.setExtractionResults({
            ...current,
            images
        });
    }
    
    static async addProductData(productData) {
        const current = await this.getExtractionResults();
        const products = current.productData || [];
        
        // Update or add product data for ASIN
        const existingIndex = products.findIndex(item => item.asin === productData.asin);
        if (existingIndex >= 0) {
            products[existingIndex] = productData;
        } else {
            products.push(productData);
        }
        
        await this.setExtractionResults({
            ...current,
            productData: products
        });
    }
    
    static async setProcessedAnalysis(analysis) {
        const current = await this.getExtractionResults();
        await this.setExtractionResults({
            ...current,
            processedAnalysis: analysis
        });
    }
    
    // ============= EXTRACTION STATUS TRACKING =============
    
    static async getExtractionStatus() {
        const data = await chrome.storage.local.get({ extractionStatus: null });
        return data.extractionStatus;
    }
    
    static async setExtractionStatus(status) {
        await chrome.storage.local.set({ extractionStatus: status });
    }
    
    static async clearExtractionStatus() {
        await chrome.storage.local.remove(['extractionStatus']);
    }
    
    // ============= UNIFIED DATA OPERATIONS =============
    
    static async getAllData() {
        const [asinList, keywords, extractorResults, webhookConfig] = await Promise.all([
            this.getASINList(),
            this.getKeywords(),
            this.getExtractionResults(),
            this.getWebhookConfig()
        ]);
        
        return {
            asinList,
            amazon_keywords: keywords,
            extractorResults,
            webhookConfig,
            timestamp: Date.now()
        };
    }
    
    static async clearAllData() {
        await chrome.storage.local.clear();
    }
    
    static async clearExtractionData() {
        await chrome.storage.local.remove(['extractorResults', 'extractionStatus']);
    }
    
    // ============= WEBHOOK PAYLOAD BUILDERS =============
    
    static async buildBasicPayload() {
        const [asinList, keywords] = await Promise.all([
            this.getASINList(),
            this.getKeywords()
        ]);
        
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
        const [basicData, extractorResults] = await Promise.all([
            this.buildBasicPayload(),
            this.getExtractionResults()
        ]);
        
        return {
            source: "amz-extractor-all",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            
            // Original ASIN data
            ...basicData,
            
            // Enhanced extraction data
            extraction_data: {
                images: extractorResults.images || [],
                processed_products: extractorResults.productData || [],
                product_strategy: extractorResults.processedAnalysis?.product_strategy || {},
                content_ready_packages: extractorResults.processedAnalysis?.content_ready_packages || {}
            }
        };
    }
    
    // ============= UTILITY FUNCTIONS =============
    
    static async getStorageUsage() {
        const data = await chrome.storage.local.get(null);
        const size = JSON.stringify(data).length;
        
        return {
            totalKeys: Object.keys(data).length,
            estimatedSizeKB: Math.round(size / 1024),
            breakdown: {
                asinList: data.asinList?.length || 0,
                extractorImages: data.extractorResults?.images?.length || 0,
                extractorProducts: data.extractorResults?.productData?.length || 0
            }
        };
    }
    
    static async export() {
        const allData = await this.getAllData();
        return {
            version: "1.0.0",
            exportDate: new Date().toISOString(),
            data: allData
        };
    }
    
    static async import(exportData) {
        if (!exportData.data) {
            throw new Error('Invalid export data format');
        }
        
        const { asinList, amazon_keywords, extractorResults, webhookConfig } = exportData.data;
        
        await Promise.all([
            asinList && this.setASINList(asinList),
            amazon_keywords && this.setKeywords(amazon_keywords),
            extractorResults && this.setExtractionResults(extractorResults),
            webhookConfig && this.setWebhookConfig(webhookConfig)
        ].filter(Boolean));
    }
}

// Storage event listener for cross-tab synchronization
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            console.log('Storage changes detected:', Object.keys(changes));
            
            // Dispatch custom events for UI updates
            if (changes.asinList) {
                window.dispatchEvent(new CustomEvent('asinListChanged', {
                    detail: changes.asinList.newValue
                }));
            }
            
            if (changes.extractorResults) {
                window.dispatchEvent(new CustomEvent('extractorResultsChanged', {
                    detail: changes.extractorResults.newValue
                }));
            }
            
            if (changes.extractionStatus) {
                window.dispatchEvent(new CustomEvent('extractionStatusChanged', {
                    detail: changes.extractionStatus.newValue
                }));
            }
        }
    });
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}