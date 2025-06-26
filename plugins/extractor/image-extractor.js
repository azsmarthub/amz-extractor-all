// Image Extractor Plugin for AMZ Extractor ALL
// Enhanced from amz-image-extractor with better error handling

class ImageExtractor {
    
    constructor() {
        this.maxRetries = 2;
        this.timeout = 20000;
        this.maxImages = 10;
    }
    
    // ============= PUBLIC METHODS =============
    
    async extractImagesForASINs(asins) {
        console.log('🖼️ ImageExtractor: Starting batch extraction for', asins.length, 'ASINs');
        
        if (!Array.isArray(asins) || asins.length === 0) {
            throw new Error('Invalid ASIN array provided');
        }
        
        const results = [];
        
        for (let i = 0; i < asins.length; i++) {
            const asin = asins[i];
            
            try {
                console.log(`🔄 Processing ASIN ${i + 1}/${asins.length}: ${asin}`);
                
                const result = await this.extractImagesForASIN(asin);
                results.push(result);
                
                // Small delay between requests
                if (i < asins.length - 1) {
                    await this.sleep(2000);
                }
                
            } catch (error) {
                console.error(`❌ Failed to extract images for ${asin}:`, error);
                results.push({
                    asin: asin,
                    status: 'error',
                    error: error.message,
                    images: [],
                    thumbnail: null
                });
            }
        }
        
        console.log('✅ ImageExtractor: Batch extraction completed');
        return results;
    }
    
    async extractImagesForASIN(asin) {
        if (!Utils.validateASIN(asin)) {
            throw new Error(`Invalid ASIN: ${asin}`);
        }
        
        console.log(`🎯 ImageExtractor: Processing ASIN ${asin}`);
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`📸 Attempt ${attempt}/${this.maxRetries} for ${asin}`);
                
                if (attempt > 1) {
                    await this.sleep(3000 * attempt); // Longer delay for retries
                }
                
                const result = await this.processASINWithTab(asin);
                
                if (result.status === 'success' && result.images.length > 0) {
                    console.log(`✅ Successfully extracted ${result.images.length} images for ${asin}`);
                    return result;
                }
                
                if (attempt === this.maxRetries) {
                    throw new Error(result.error || 'No images found after all attempts');
                }
                
            } catch (error) {
                console.log(`⚠️ Attempt ${attempt} failed for ${asin}:`, error.message);
                
                if (attempt === this.maxRetries) {
                    throw error;
                }
            }
        }
    }
    
    // ============= CORE EXTRACTION LOGIC =============
    
    async processASINWithTab(asin) {
        let tab = null;
        
        try {
            console.log(`🌐 Creating tab for ASIN: ${asin}`);
            
            // Create hidden tab
            tab = await chrome.tabs.create({
                url: `https://www.amazon.com/dp/${asin}`,
                active: false
            });
            
            console.log(`📑 Tab ${tab.id} created for ${asin}`);
            
            // Wait for page to load
            const loadResult = await this.waitForPageLoad(tab.id);
            
            if (!loadResult.success) {
                throw new Error(loadResult.error);
            }
            
            console.log(`📄 Page loaded for ${asin}, extracting images...`);
            
            // Extract images using content script
            const extractResult = await this.extractImagesFromTab(tab.id, asin);
            
            if (!extractResult || extractResult.error) {
                throw new Error(extractResult?.error || 'No image data received');
            }
            
            // Validate and format result
            const formattedResult = this.formatExtractionResult(extractResult, asin);
            
            return formattedResult;
            
        } catch (error) {
            console.error(`💥 Error processing ${asin}:`, error);
            return {
                asin: asin,
                status: 'error',
                error: error.message,
                images: [],
                thumbnail: null
            };
        } finally {
            // Clean up tab
            if (tab) {
                try {
                    await chrome.tabs.remove(tab.id);
                    console.log(`🗑️ Tab ${tab.id} closed for ${asin}`);
                } catch (closeError) {
                    console.error(`Failed to close tab for ${asin}:`, closeError);
                }
            }
        }
    }
    
    async waitForPageLoad(tabId, timeoutMs = 20000) {
        return new Promise((resolve) => {
            const timeoutTimer = setTimeout(() => {
                console.log(`⏰ Page load timeout for tab ${tabId}`);
                resolve({
                    success: false,
                    error: 'Page load timeout (20s)'
                });
            }, timeoutMs);

            const checkLoad = async () => {
                try {
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: () => {
                            const hasTitle = document.querySelector('#productTitle, .product-title, h1.a-size-large');
                            const isLoaded = document.readyState === 'complete';
                            const noCaptcha = !document.querySelector('[name="cvf_captcha_input"]');
                            const noError = !document.querySelector('#error-page, .a-error-page, .error-page');
                            const noRobotCheck = !document.title.includes('Robot Check');
                            
                            if (document.querySelector('[name="cvf_captcha_input"]')) {
                                return { loaded: false, reason: 'captcha' };
                            }
                            
                            if (document.querySelector('#error-page, .a-error-page, .error-page')) {
                                return { loaded: false, reason: 'error_page' };
                            }
                            
                            if (document.title.includes('404') || document.title.includes('Error') || document.title.includes('Robot Check')) {
                                return { loaded: false, reason: 'not_found' };
                            }
                            
                            if (!isLoaded) {
                                return { loaded: false, reason: 'loading' };
                            }
                            
                            if (!hasTitle) {
                                return { loaded: false, reason: 'no_title' };
                            }
                            
                            return { loaded: true };
                        }
                    });

                    const result = results[0]?.result;
                    
                    if (result?.loaded) {
                        clearTimeout(timeoutTimer);
                        console.log(`✅ Page loaded successfully for tab ${tabId}`);
                        resolve({ success: true });
                    } else if (result?.reason === 'captcha') {
                        clearTimeout(timeoutTimer);
                        resolve({ success: false, error: 'Amazon blocked request (CAPTCHA)' });
                    } else if (result?.reason === 'error_page' || result?.reason === 'not_found') {
                        clearTimeout(timeoutTimer);
                        resolve({ success: false, error: 'ASIN not found or product unavailable' });
                    } else {
                        // Continue checking
                        setTimeout(checkLoad, 1000);
                    }
                } catch (error) {
                    console.error(`Error checking page load for tab ${tabId}:`, error);
                    clearTimeout(timeoutTimer);
                    resolve({ success: false, error: 'Failed to check page status: ' + error.message });
                }
            };

            // Start checking after initial delay
            setTimeout(checkLoad, 2000);
        });
    }
    
    async extractImagesFromTab(tabId, asin) {
        try {
            // Try content script message first
            let extractResult = null;
            try {
                extractResult = await chrome.tabs.sendMessage(tabId, {
                    type: 'EXTRACT_GALLERY_IMAGES'
                });
                console.log(`📨 Content script result for ${asin}:`, extractResult);
            } catch (contentScriptError) {
                console.log(`🔧 Content script failed for ${asin}, trying injection:`, contentScriptError);
                
                // Inject content script if needed
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['core/content.js']
                    });
                    
                    // Try again after injection
                    extractResult = await chrome.tabs.sendMessage(tabId, {
                        type: 'EXTRACT_GALLERY_IMAGES'
                    });
                } catch (injectionError) {
                    console.log('🔧 Content script injection failed, using direct injection');
                    
                    // Fallback to direct injection
                    const injectionResult = await chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: this.injectableExtractFunction
                    });
                    
                    extractResult = injectionResult[0]?.result;
                }
            }
            
            return extractResult;
            
        } catch (error) {
            console.error(`💥 Failed to extract images from tab for ${asin}:`, error);
            return { error: error.message };
        }
    }
    
    // ============= INJECTABLE EXTRACTION FUNCTION =============
    
    injectableExtractFunction() {
        try {
            console.log('🔍 Injectable image extraction started');
            
            // Get ASIN from URL
            const urlMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
            const asin = urlMatch ? urlMatch[1] : null;
            
            if (!asin) {
                return { error: 'Invalid URL', details: 'No ASIN found in URL' };
            }

            // Check for error conditions
            if (document.querySelector('[name="cvf_captcha_input"]')) {
                return { error: 'CAPTCHA required', details: 'Amazon is blocking automated requests' };
            }

            if (document.querySelector('#error-page, .a-error-page, .error-page')) {
                return { error: 'Product page error', details: 'ASIN may not exist or product unavailable' };
            }

            if (document.title.includes('404') || document.title.includes('Error') || document.title.includes('Robot Check')) {
                return { error: 'ASIN not found', details: 'Product does not exist or access blocked' };
            }

            // Get product title
            const titleSelectors = [
                '#productTitle',
                '.product-title', 
                'h1.a-size-large',
                'h1[data-automation-id="product-title"]',
                '.a-size-large.a-spacing-none.a-color-base',
                'h1.a-size-base-plus',
                'span#productTitle',
                '.pdp-product-name',
                '[data-testid="product-title"]'
            ];

            let title = '';
            for (const selector of titleSelectors) {
                const titleElement = document.querySelector(selector);
                if (titleElement && titleElement.textContent.trim()) {
                    title = titleElement.textContent.trim();
                    break;
                }
            }

            title = title.replace(/\s+/g, ' ').trim();

            // Extract images
            const imageUrls = [];
            
            // Try JavaScript data extraction
            let foundFromJS = false;
            const scripts = document.querySelectorAll('script');
            
            scripts.forEach(script => {
                if (foundFromJS) return;
                
                const text = script.textContent;
                if (text && (text.includes('colorImages') || text.includes('ImageBlockATF'))) {
                    
                    // Try regex extraction for hiRes images
                    const allHiResMatches = text.match(/"hiRes":\s*"([^"]+)"/g);
                    if (allHiResMatches && allHiResMatches.length > 0) {
                        allHiResMatches.forEach((match, index) => {
                            if (index >= 10) return;
                            const url = match.replace(/"hiRes":\s*"/, '').replace(/"$/, '');
                            if (url && url.includes('amazon.com') && url.length > 50) {
                                imageUrls.push(url);
                            }
                        });
                        foundFromJS = imageUrls.length > 0;
                    }
                }
            });

            // Fallback to HTML extraction
            if (!foundFromJS) {
                // Get main image
                const mainImageSelectors = [
                    '#landingImage',
                    '.a-dynamic-image[data-a-image-name="landingImage"]',
                    '#imgTagWrapperId img',
                    '.imgTagWrapper img',
                    '#main-image-container img'
                ];

                for (const selector of mainImageSelectors) {
                    const img = document.querySelector(selector);
                    if (img) {
                        const imageUrl = img.dataset.oldHires || img.dataset.aHires || img.src;
                        if (imageUrl && imageUrl.includes('amazon.com') && imageUrl.length > 50) {
                            imageUrls.push(imageUrl);
                            break;
                        }
                    }
                }

                // Get gallery thumbnails
                const gallerySelectors = [
                    '#altImages .imageThumbnail img',
                    '#altImages img',
                    '.item.imageThumbnail img'
                ];

                for (const selector of gallerySelectors) {
                    const thumbnails = document.querySelectorAll(selector);
                    thumbnails.forEach((img, index) => {
                        if (imageUrls.length >= 10) return;
                        
                        if (img.src && img.src.includes('amazon.com') && img.src.length > 50) {
                            // Convert thumbnail to full size
                            const fullSizeUrl = img.src
                                .replace(/_AC_US\d+_/g, '_AC_SL1500_')
                                .replace(/_US\d+_/g, '_SL1500_');
                            if (!imageUrls.includes(fullSizeUrl)) {
                                imageUrls.push(fullSizeUrl);
                            }
                        }
                    });
                    
                    if (imageUrls.length > 0) break;
                }
            }

            const finalImages = imageUrls.slice(0, 10).filter(url => 
                url && url.startsWith('http') && url.length > 50
            );

            if (finalImages.length === 0) {
                return { error: 'No gallery images found', details: 'Could not locate any product images' };
            }

            const result = {
                asin: asin,
                title: title,
                images: finalImages,
                thumbnail: finalImages[0],
                pageUrl: window.location.href
            };

            console.log('🎉 Injectable function result:', result);
            return result;

        } catch (error) {
            console.error('💥 Injectable function error:', error);
            return { error: 'Script execution error', details: error.message };
        }
    }
    
    // ============= UTILITY FUNCTIONS =============
    
    formatExtractionResult(extractResult, asin) {
        if (!extractResult || extractResult.error) {
            return {
                asin: asin,
                status: 'error',
                error: extractResult?.error || 'Unknown error',
                images: [],
                thumbnail: null
            };
        }
        
        // Validate images
        const validImages = (extractResult.images || []).filter(url => 
            url && 
            typeof url === 'string' && 
            url.startsWith('http') && 
            url.includes('amazon.com') &&
            url.length > 50
        );
        
        if (validImages.length === 0) {
            return {
                asin: asin,
                status: 'error',
                error: 'No valid images found',
                images: [],
                thumbnail: null
            };
        }
        
        return {
            asin: asin,
            status: 'success',
            title: extractResult.title || 'Unknown Product',
            images: validImages.slice(0, this.maxImages),
            thumbnail: validImages[0],
            pageUrl: extractResult.pageUrl || `https://www.amazon.com/dp/${asin}`,
            imageCount: validImages.length,
            extractedAt: new Date().toISOString()
        };
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ============= VALIDATION FUNCTIONS =============
    
    validateExtractionResult(result) {
        if (!result) return false;
        if (!result.asin || !Utils.validateASIN(result.asin)) return false;
        if (result.status !== 'success') return true; // Error results are valid
        if (!Array.isArray(result.images)) return false;
        if (result.images.length === 0) return false;
        
        return true;
    }
    
    static isValidImageUrl(url) {
        if (!url || typeof url !== 'string' || url.length < 50) {
            return false;
        }
        
        const lowerUrl = url.toLowerCase();
        
        // Filter out GIF images (usually icons/animations)
        if (url.includes('.gif')) {
            return false;
        }
        
        // Filter out data URLs, loading placeholders
        if (lowerUrl.includes('data:image') || 
            lowerUrl.includes('loading') ||
            lowerUrl.includes('placeholder') ||
            lowerUrl.includes('transparent') ||
            lowerUrl.includes('1x1') ||
            lowerUrl.includes('pixel') ||
            lowerUrl.includes('spacer')) {
            return false;
        }
        
        // Must be from Amazon's media domains
        if (!lowerUrl.includes('amazon.com') && 
            !lowerUrl.includes('media-amazon.com') && 
            !lowerUrl.includes('ssl-images-amazon.com')) {
            return false;
        }
        
        // Filter out video thumbnails and UI elements
        if (lowerUrl.includes('play-button') || 
            lowerUrl.includes('pkplay-button') ||
            lowerUrl.includes('video-thumb') ||
            lowerUrl.includes('ui-') ||
            lowerUrl.includes('icon-')) {
            return false;
        }
        
        return true;
    }
}

// Export for use by other plugins
if (typeof window !== 'undefined') {
    window.ImageExtractor = ImageExtractor;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageExtractor;
}

console.log('🖼️ ImageExtractor plugin loaded');