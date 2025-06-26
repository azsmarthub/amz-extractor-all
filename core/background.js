// Background script for AMZ Extractor ALL
// Enhanced from ASIN Collector with plugin support

// Hàm cập nhật badge icon extension
function updateBadge() {
    chrome.storage.local.get({ asinList: [] }, function(result) {
        const count = result.asinList.length;
        chrome.action.setBadgeText({ text: count > 0 ? count.toString() : "" });
        chrome.action.setBadgeBackgroundColor({ color: "#1976d2" });
    });
}

// Đảm bảo luôn cập nhật khi extension khởi động hoặc cài lại
chrome.runtime.onStartup.addListener(updateBadge);
chrome.runtime.onInstalled.addListener(updateBadge);

// Lắng nghe khi storage thay đổi (asinList thay đổi)
chrome.storage.onChanged.addListener(function(changes, area) {
    if (area === "local" && changes.asinList) {
        updateBadge();
    }
});

// Enhanced message listener with plugin support
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Background received message:', request.type);
    
    if (request.type === 'UPDATE_BADGE') {
        updateBadge();
        sendResponse({success: true});
    } 
    else if (request.type === 'EXTRACT_IMAGES') {
        // Handle image extraction requests from plugin
        handleImageExtraction(request.asins, sendResponse);
        return true; // Keep channel open for async response
    }
    else if (request.type === 'PROCESS_DATA') {
        // Handle data processing requests from plugin  
        handleDataProcessing(request.data, sendResponse);
        return true;
    }
    else if (request.type === 'GET_EXTRACTION_STATUS') {
        // Return current extraction status
        chrome.storage.local.get('extractionStatus', (data) => {
            sendResponse(data.extractionStatus || null);
        });
        return true;
    }
    
    return true; // Keep the message channel open for async response
});

// Plugin support functions
async function handleImageExtraction(asins, sendResponse) {
    console.log('Background handling image extraction for ASINs:', asins);
    
    // Send immediate response to popup
    sendResponse({ success: true, message: 'Image extraction started' });
    
    // Initialize extraction status
    const extractionStatus = {
        inProgress: true,
        total: asins.length,
        processed: 0,
        successful: 0,
        failed: 0,
        currentMessage: 'Starting image extraction...',
        startTime: Date.now(),
        type: 'images'
    };
    
    // Save initial status
    await chrome.storage.local.set({ extractionStatus });
    
    try {
        // Load existing results
        const existingData = await chrome.storage.local.get('extractorResults');
        const existingResults = existingData.extractorResults?.images || [];
        
        for (let i = 0; i < asins.length; i++) {
            const asin = asins[i];
            
            // Update status
            extractionStatus.currentMessage = `Processing images for ${asin}...`;
            await chrome.storage.local.set({ extractionStatus });
            
            // Process ASIN images (will be implemented in plugin)
            const result = await processASINImages(asin);
            
            if (result.status === 'success') {
                extractionStatus.successful++;
                existingResults.push(result);
                
                // Save results incrementally
                await chrome.storage.local.set({
                    extractorResults: {
                        ...existingData.extractorResults,
                        images: existingResults,
                        timestamp: Date.now()
                    }
                });
            } else {
                extractionStatus.failed++;
            }
            
            extractionStatus.processed++;
            await chrome.storage.local.set({ extractionStatus });
            
            // Small delay between requests
            if (i < asins.length - 1) {
                await sleep(2000);
            }
        }
        
        // Mark as completed
        extractionStatus.inProgress = false;
        extractionStatus.currentMessage = 'Image extraction completed';
        await chrome.storage.local.set({ extractionStatus });
        
    } catch (error) {
        console.error('Error in handleImageExtraction:', error);
        extractionStatus.inProgress = false;
        extractionStatus.currentMessage = 'Image extraction failed: ' + error.message;
        await chrome.storage.local.set({ extractionStatus });
    }
}

async function handleDataProcessing(data, sendResponse) {
    console.log('Background handling data processing');
    
    sendResponse({ success: true, message: 'Data processing started' });
    
    // Will be implemented in plugin
    // For now just acknowledge
}

// Placeholder for image processing (will be implemented by plugin)
async function processASINImages(asin) {
    // This will be handled by plugins/extractor/image-extractor.js
    console.log('Processing images for ASIN:', asin);
    
    // Placeholder implementation
    return {
        asin: asin,
        status: 'success',
        images: [],
        timestamp: Date.now()
    };
}

// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Keep service worker alive
let keepAliveInterval;

function startKeepAlive() {
    keepAliveInterval = setInterval(() => {
        chrome.storage.local.get('keepAlive').then(() => {
            // Do nothing, just prevent service worker from sleeping
        });
    }, 25000);
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
}

startKeepAlive();

self.addEventListener('beforeunload', () => {
    stopKeepAlive();
});

console.log('AMZ Extractor ALL background script loaded');