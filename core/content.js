// Content script for AMZ Extractor ALL
// Enhanced from ASIN Collector with image extraction support

// === Enhanced Styles for AMZ Extractor ALL ===
(function injectEnhancedStyles() {
    const css = `
/* ============= BASE BUTTON STYLES ============= */
.asin-picker-wrap {
    position: absolute !important;
    z-index: 2999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    pointer-events: auto !important;
    visibility: visible !important;
    opacity: 1 !important;
}

.asin-picker-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    font-size: 0.8em !important;
    padding: 10px 16px !important;
    border-radius: 12px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    overflow: hidden !important;
    white-space: nowrap !important;
    text-overflow: ellipsis !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    position: relative !important;
    text-align: center !important;
    width: 100% !important;
    box-sizing: border-box !important;
    min-width: 180px !important;
    max-width: 250px !important;
    line-height: 1.3 !important;
    border: 0px solid transparent !important;
}

/* ============= STATE 1: DEFAULT (BLUE) ============= */
.asin-picker-btn:not(.selected):not(.delete-hover) {
    background: linear-gradient(135deg,rgb(68, 139, 255) 0%,rgb(52, 112, 242) 100%) !important;
    border-color: #1d4ed8 !important;
    color: #ffffff !important;
    box-shadow: 0 3px 12px rgba(59, 130, 246, 0.25) !important;
}

.asin-picker-btn:not(.selected):not(.delete-hover):hover {
    background: linear-gradient(135deg,rgb(29, 94, 234) 0%,rgb(23, 72, 207) 100%) !important;
    border-color: #1e40af !important;
    color: #ffffff !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4) !important;
}

/* ============= STATE 2: SELECTED (GREEN) ============= */
.asin-picker-btn.selected:not(.delete-hover) {
    background: linear-gradient(135deg,rgb(17, 176, 33) 0%,rgb(17, 155, 33) 100%) !important;
    border-color: #047857 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3) !important;
}

.asin-picker-btn.selected:not(.delete-hover):hover {
    background: linear-gradient(135deg,rgb(17, 176, 33) 0%,rgb(17, 155, 33) 100%) !important;
    border-color: #065f46 !important;
    color: #ffffff !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4) !important;
}

/* ============= STATE 3: DELETE HOVER (RED) ============= */
.asin-picker-btn.selected.delete-hover {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
    border-color: #b91c1c !important;
    color: #ffffff !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4) !important;
}

/* FORCE TEXT VISIBILITY */
.asin-picker-btn * {
    visibility: visible !important;
    opacity: 1 !important;
    color: inherit !important;
    font-size: inherit !important;
    font-weight: inherit !important;
    display: inline !important;
}

.asin-picker-btn svg {
    display: inline !important;
    flex-shrink: 0 !important;
    width: 16px !important;
    height: 16px !important;
    margin-right: 6px !important;
}

/* ============= LAYOUT SPECIFIC POSITIONING ============= */
.puisg-col-4-of-4 .s-product-image-container {
    position: relative !important;
    min-height: 200px !important;
}

.puisg-col-4-of-4 .asin-picker-wrap {
    bottom: 12px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: calc(100% - 20px) !important;
    max-width: 220px !important;
}

.puisg-col-4-of-4 .asin-picker-btn {
    font-size: 0.85em !important;
    padding: 8px 14px !important;
    min-width: 160px !important;
    max-width: 220px !important;
}

.sg-col-4-of-24 .s-product-image-container,
.sg-col-4-of-20 .s-product-image-container,
.sg-col-4-of-16 .s-product-image-container,
.sg-col-4-of-12 .s-product-image-container {
    position: relative !important;
    min-height: 220px !important;
}

.sg-col-4-of-24 .asin-picker-wrap,
.sg-col-4-of-20 .asin-picker-wrap,
.sg-col-4-of-16 .asin-picker-wrap,
.sg-col-4-of-12 .asin-picker-wrap {
    bottom: 12px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: calc(100% - 16px) !important;
    max-width: 200px !important;
}

.sg-col-4-of-24 .asin-picker-btn,
.sg-col-4-of-20 .asin-picker-btn,
.sg-col-4-of-16 .asin-picker-btn,
.sg-col-4-of-12 .asin-picker-btn {
    font-size: 0.75em !important;
    padding: 8px 12px !important;
    min-width: 140px !important;
    max-width: 200px !important;
}

/* ============= PRODUCT DETAIL PAGE STICKY BUTTON ============= */
.asin-detail-sticky-wrap {
    position: fixed !important;
    top: 155px !important;
    right: 20px !important;
    z-index: 9999 !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    width: 242px !important;
    box-sizing: border-box !important;
}

.asin-detail-sticky-btn {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0px !important;
    font-size: 14px !important;
    padding: 12px 20px !important;
    border-radius: 20px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    position: relative !important;
    text-align: center !important;
    box-sizing: border-box !important;
    width: 100% !important;
    line-height: 1.2 !important;
    border: none !important;
    text-transform: none !important;
    letter-spacing: 0px !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15) !important;
    
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
    font-style: normal !important;
    text-decoration: none !important;
    text-indent: 0 !important;
    white-space: nowrap !important;
    overflow: visible !important;
    text-overflow: clip !important;
}

.asin-detail-sticky-btn:not(.selected):not(.delete-hover) {
    background: #3b82f6 !important;
    color: #ffffff !important;
    box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3) !important;
}

.asin-detail-sticky-btn:not(.selected):not(.delete-hover):hover {
    background: #2563eb !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4) !important;
}

.asin-detail-sticky-btn.selected:not(.delete-hover) {
    background: linear-gradient(135deg,rgb(17, 176, 33) 0%,rgb(17, 155, 33) 100%) !important;
    color: #ffffff !important;
    box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3) !important;
}

.asin-detail-sticky-btn.selected:not(.delete-hover):hover {
    background: linear-gradient(135deg,rgb(17, 176, 33) 0%,rgb(17, 155, 33) 100%) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;
}

.asin-detail-sticky-btn.selected.delete-hover {
    background: #ef4444 !important;
    color: #ffffff !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4) !important;
}

div[data-component-type="s-search-result"] {
    position: relative !important;
}

.s-product-image-container {
    position: relative !important;
}

.a-popover, .a-dropdown, .a-tooltip {
    z-index: 3100 !important;
}
`;

    const style = document.createElement('style');
    style.id = 'asin-picker-enhanced-styles';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    
    // Remove old styles
    document.querySelectorAll('#asin-picker-fixed-states, #asin-picker-modern-styles, #asin-picker-force-styles').forEach(s => s.remove());
    
    document.head.appendChild(style);
    
    console.log('✅ AMZ Extractor ALL: Enhanced styles injected');
})();

// Enhanced utility functions
function getASINFromURL(url) {
    const asinMatch = url.match(/([A-Z0-9]{10})(?:[/?]|$)/i);
    if (asinMatch) return asinMatch[1];
    return null;
}

function findASINInBlock(el) {
    let asin = el.getAttribute('data-asin');
    if (asin && asin.length === 10) return asin;

    let input = el.querySelector('input[name="asin"], input[name="ASIN"]');
    if (input && input.value && input.value.length === 10) return input.value;

    let aTags = el.querySelectorAll('a[href*="/dp/"], a[href*="/gp/product/"]');
    for (let a of aTags) {
        let aASIN = getASINFromURL(a.href);
        if (aASIN && aASIN.length === 10) return aASIN;
    }

    let id = el.id;
    if (id && id.match(/[A-Z0-9]{10}/i)) {
        let idASIN = id.match(/[A-Z0-9]{10}/i)[0];
        return idASIN;
    }

    return null;
}

// Check if current page is product detail page
function isProductDetailPage() {
    return window.location.pathname.includes('/dp/') || window.location.pathname.includes('/gp/product/');
}

// Extract ASIN from current URL
function getASINFromCurrentURL() {
    return getASINFromURL(window.location.href);
}

// Enhanced image extraction function (for plugin use)
function extractGalleryImages() {
    try {
        console.log('Starting enhanced image extraction...');
        
        const urlMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
        const asin = urlMatch ? urlMatch[1] : null;
        
        if (!asin) {
            return {
                error: 'Invalid URL',
                details: 'No ASIN found in URL'
            };
        }

        // Check for error conditions
        if (document.querySelector('[name="cvf_captcha_input"]')) {
            return {
                error: 'CAPTCHA required',
                details: 'Amazon is blocking automated requests'
            };
        }

        if (document.querySelector('#error-page, .a-error-page, .error-page')) {
            return {
                error: 'Product page error',
                details: 'ASIN may not exist or product unavailable'
            };
        }

        // Get product title
        const titleSelectors = [
            '#productTitle',
            '.product-title', 
            'h1.a-size-large',
            'h1[data-automation-id="product-title"]',
            '.a-size-large.a-spacing-none.a-color-base'
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

        // Extract images using enhanced method
        const imageUrls = [];
        
        // Try JavaScript data extraction first
        let foundFromJS = false;
        const scripts = document.querySelectorAll('script');
        
        scripts.forEach(script => {
            if (foundFromJS) return;
            
            const text = script.textContent;
            if (text && (text.includes('colorImages') || text.includes('ImageBlockATF'))) {
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

        return {
            asin: asin,
            title: title,
            images: finalImages,
            thumbnail: finalImages[0],
            pageUrl: window.location.href
        };

    } catch (error) {
        console.error('Enhanced image extraction error:', error);
        return { error: 'Script execution error', details: error.message };
    }
}

// Get product details from product detail page
function getProductDetailsFromPage() {
    const asin = getASINFromCurrentURL();
    if (!asin) return null;

    let title = '';
    const titleSelectors = [
        '#productTitle',
        '.product-title',
        '.a-size-large.product-title-word-break',
        'h1.a-size-large span'
    ];
    
    for (const selector of titleSelectors) {
        const titleEl = document.querySelector(selector);
        if (titleEl && titleEl.textContent.trim()) {
            title = titleEl.textContent.trim();
            break;
        }
    }

    let img = '';
    const imageSelectors = [
        '#landingImage',
        '.a-dynamic-image',
        '.s-image',
        '.product-image img',
        'img[data-old-hires]'
    ];
    
    for (const selector of imageSelectors) {
        const imgEl = document.querySelector(selector);
        if (imgEl && imgEl.src) {
            img = imgEl.src;
            break;
        }
    }

    const link = `https://www.amazon.com/dp/${asin}/`;

    return {
        asin,
        title: title || 'Product Detail',
        img: img || '',
        link
    };
}

// Rest of ASIN Collector content.js functionality...
// (Include all the existing button injection and scanning logic)

// Inject sticky button for product detail page
function injectProductDetailButton() {
    if (!isProductDetailPage()) return;
    
    if (document.querySelector('.asin-detail-sticky-wrap')) {
        return;
    }

    const productDetails = getProductDetailsFromPage();
    if (!productDetails) {
        console.log('❌ Could not extract product details');
        return;
    }

    console.log('🎯 AMZ Extractor ALL: Injecting button for product detail page', productDetails.asin);

    const stickyWrap = document.createElement('div');
    stickyWrap.className = 'asin-detail-sticky-wrap';
    stickyWrap.setAttribute('data-asin-sticky-wrap', 'true');

    const btn = document.createElement('button');
    btn.className = 'asin-detail-sticky-btn';
    btn.setAttribute('data-asin', productDetails.asin);
    btn.setAttribute('data-asin-detail-btn', 'true');
    btn.type = 'button';

    let isSelected = false;
    let isHovered = false;

    function setButtonContent(state) {
        let textContent = '';
        
        if (state === 'default') {
            btn.className = 'asin-detail-sticky-btn';
            textContent = '+ Add to Collection';
        } else if (state === 'selected') {
            btn.className = 'asin-detail-sticky-btn selected';
            textContent = '✓ Added to Collection';
        } else if (state === 'delete') {
            btn.className = 'asin-detail-sticky-btn selected delete-hover';
            textContent = '✕ Remove from Collection';
        }
        
        btn.textContent = textContent;
        btn.setAttribute('aria-label', textContent);
        btn.setAttribute('title', textContent);
        
        console.log(`🎨 Set sticky button state: ${state} for ASIN ${productDetails.asin}`);
    }

    function updateFromStorage() {
        chrome.storage.local.get({asinList: []}, (result) => {
            const wasSelected = isSelected;
            isSelected = result.asinList.some(item => item.asin === productDetails.asin);
            
            if (isSelected !== wasSelected) {
                if (isSelected) {
                    setButtonContent('selected');
                } else {
                    setButtonContent('default');
                }
            }
        });
    }

    updateFromStorage();
    btn._updateFromStorage = updateFromStorage;

    btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        chrome.storage.local.get({asinList: []}, (result) => {
            let asinList = result.asinList;
            
            if (!isSelected) {
                if (!asinList.some(item => item.asin === productDetails.asin)) {
                    asinList.push(productDetails);
                    chrome.storage.local.set({asinList});
                    console.log(`✅ Added ASIN ${productDetails.asin} to storage`);
                }
                isSelected = true;
                setButtonContent('selected');
            } else if (isHovered) {
                asinList = asinList.filter(item => item.asin !== productDetails.asin);
                chrome.storage.local.set({asinList});
                isSelected = false;
                isHovered = false;
                setButtonContent('default');
                console.log(`🗑️ Removed ASIN ${productDetails.asin} from storage`);
            }
        });
    };

    btn.onmouseenter = function() {
        if (isSelected) {
            isHovered = true;
            setButtonContent('delete');
        }
    };
    
    btn.onmouseleave = function() {
        if (isSelected) {
            isHovered = false;
            setButtonContent('selected');
        }
    };

    stickyWrap.appendChild(btn);
    document.body.appendChild(stickyWrap);

    console.log(`✅ Enhanced button injected for product detail ASIN: ${productDetails.asin}`);
}

function detectLayoutType(productElement) {
    if (productElement.querySelector('.puisg-col-4-of-4')) {
        return 'horizontal';
    }
    
    if (productElement.classList.contains('sg-col-4-of-24') ||
        productElement.classList.contains('sg-col-4-of-20') ||
        productElement.classList.contains('sg-col-4-of-16') ||
        productElement.classList.contains('sg-col-4-of-12')) {
        return 'vertical';
    }
    
    return 'unknown';
}

function injectASINPickerBtn(imageContainer, asin, link, title, img, layoutType) {
    if (!asin || !imageContainer || imageContainer.querySelector('.asin-picker-btn')) {
        return;
    }
    
    console.log(`🎯 AMZ Extractor ALL: Injecting button for ASIN ${asin} in ${layoutType} layout`);
    
    imageContainer.querySelectorAll('.asin-picker-wrap').forEach(e => e.remove());

    if (getComputedStyle(imageContainer).position === 'static') {
        imageContainer.style.position = 'relative';
    }

    const wrap = document.createElement('div');
    wrap.className = 'asin-picker-wrap';
    wrap.setAttribute('data-asin-picker-wrap', 'true');
    
    const btn = document.createElement('button');
    btn.className = 'asin-picker-btn';
    btn.setAttribute('data-asin', asin);
    btn.setAttribute('data-asin-picker-btn', 'true');
    btn.type = 'button';

    function setButtonContent(state) {
        btn.innerHTML = '';
        
        let iconHTML = '';
        let textContent = '';
        
        if (state === 'default') {
            btn.className = 'asin-picker-btn';
            iconHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px; flex-shrink: 0;">
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5V2zm6.5 3.5a.5.5 0 0 0-1 0V7H6a.5.5 0 0 0 0 1h1.5v1.5a.5.5 0 0 0 1 0V8H10a.5.5 0 0 0 0-1H8.5V5.5z" fill="white"/>
            </svg>`;
            textContent = `ASIN: ${asin} | Select`;
        } else if (state === 'selected') {
            btn.className = 'asin-picker-btn selected';
            iconHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" style="margin-right: 6px; flex-shrink: 0;">
                <circle cx="10" cy="10" r="10" fill="white"/>
                <path d="M6 10.8l2.8 2.2 5-6.2" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
            textContent = `Selected: ${asin}`;
        } else if (state === 'delete') {
            btn.className = 'asin-picker-btn selected delete-hover';
            iconHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 6px; flex-shrink: 0;">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
            textContent = 'Remove!';
        }
        
        const contentWrapper = document.createElement('span');
        contentWrapper.style.cssText = 'display: inline-flex !important; align-items: center !important; color: inherit !important; font-weight: inherit !important; font-size: inherit !important; visibility: visible !important; opacity: 1 !important;';
        contentWrapper.innerHTML = iconHTML + `<span style="color: inherit !important; font-weight: inherit !important;">${textContent}</span>`;
        
        btn.appendChild(contentWrapper);
        
        console.log(`🎨 Set button state: ${state} for ASIN ${asin}`);
    }

    let isSelected = false;
    let isHovered = false;
    
    function updateFromStorage() {
        chrome.storage.local.get({asinList: []}, (result) => {
            const wasSelected = isSelected;
            isSelected = result.asinList.some(item => item.asin === asin);
            
            if (isSelected !== wasSelected) {
                if (isSelected) {
                    setButtonContent('selected');
                } else {
                    setButtonContent('default');
                }
            }
        });
    }
    
    updateFromStorage();
    btn._updateFromStorage = updateFromStorage;

    btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        chrome.storage.local.get({asinList: []}, (result) => {
            let asinList = result.asinList;
            
            if (!isSelected) {
                if (!asinList.some(item => item.asin === asin)) {
                    let safeTitle = (title && title.length > 2) ? title : "Unknown Title";
                    asinList.push({ asin, link, title: safeTitle, img });
                    chrome.storage.local.set({asinList});
                    console.log(`✅ Added ASIN ${asin} to storage`);
                }
                isSelected = true;
                setButtonContent('selected');
            } else if (isHovered) {
                asinList = asinList.filter(item => item.asin !== asin);
                chrome.storage.local.set({asinList});
                isSelected = false;
                isHovered = false;
                setButtonContent('default');
                console.log(`🗑️ Removed ASIN ${asin} from storage`);
            }
        });
    };

    btn.onmouseenter = function() {
        if (isSelected) {
            isHovered = true;
            setButtonContent('delete');
        }
    };
    
    btn.onmouseleave = function() {
        if (isSelected) {
            isHovered = false;
            setButtonContent('selected');
        }
    };

    wrap.appendChild(btn);
    imageContainer.appendChild(wrap);
    
    console.log(`✅ Enhanced button injected for ${asin}`);
}

function scanProducts() {
    console.log('🔍 AMZ Extractor ALL: Scanning products...');
    
    const productElements = document.querySelectorAll('div[data-component-type="s-search-result"]');
    console.log(`📊 Found ${productElements.length} product elements`);
    
    productElements.forEach((productElement, index) => {
        const asin = findASINInBlock(productElement);
        if (!asin) return;

        const layoutType = detectLayoutType(productElement);
        let imageContainer = productElement.querySelector('.s-product-image-container');
        if (!imageContainer) return;

        let linkTag = productElement.querySelector('h2 a, a.a-link-normal.s-line-clamp-2, a.a-link-normal.s-line-clamp-4, a[href*="/dp/"]');
        let link = '';
        if (linkTag) {
            link = linkTag.href.startsWith('http') ? linkTag.href : 'https://www.amazon.com' + linkTag.getAttribute('href').split('?')[0];
        }

        let title = '';
        if (linkTag && linkTag.textContent) {
            title = linkTag.textContent.trim();
        } else {
            let h2 = productElement.querySelector('h2');
            if (h2 && h2.getAttribute('aria-label')) {
                title = h2.getAttribute('aria-label').trim();
            } else {
                title = 'Unknown Title';
            }
        }

        let img = '';
        let imgTag = imageContainer.querySelector('img.s-image, img');
        if (imgTag) img = imgTag.src;

        injectASINPickerBtn(imageContainer, asin, link, title, img, layoutType);
    });
}

function refreshAllASINButtons() {
    document.querySelectorAll('.asin-picker-btn').forEach(btn => {
        if (btn._updateFromStorage) {
            btn._updateFromStorage();
        }
    });
    
    const stickyBtn = document.querySelector('.asin-detail-sticky-btn');
    if (stickyBtn && stickyBtn._updateFromStorage) {
        stickyBtn._updateFromStorage();
    }
}

// Initialize based on page type
console.log('🚀 AMZ Extractor ALL: Enhanced content script initializing...');

if (isProductDetailPage()) {
    console.log('📱 Product Detail Page detected');
    setTimeout(injectProductDetailButton, 100);
    setTimeout(injectProductDetailButton, 500);
    setTimeout(injectProductDetailButton, 1000);
} else {
    console.log('📋 Search Results Page detected');
    setTimeout(scanProducts, 50);
    setTimeout(scanProducts, 200);
    setTimeout(scanProducts, 500);
    setTimeout(scanProducts, 1000);
    setTimeout(scanProducts, 2000);
}

// Observe DOM changes
const observer = new MutationObserver(() => {
    if (isProductDetailPage()) {
        setTimeout(injectProductDetailButton, 100);
    } else {
        setTimeout(scanProducts, 100);
    }
});
observer.observe(document.body, { childList: true, subtree: true });

// Enhanced message listener with image extraction support
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'CLEAR_ALL_ASIN' || request.type === 'UPDATE_ASIN_BUTTONS') {
        refreshAllASINButtons();
        sendResponse({success: true});
    } else if (request.type === 'EXTRACT_GALLERY_IMAGES') {
        // Handle image extraction request from plugin
        const result = extractGalleryImages();
        sendResponse(result);
    }
    return true;
});

// Enhanced debug tools
window.amzExtractorDebug = {
    scanProducts,
    injectProductDetailButton,
    refreshAllASINButtons,
    isProductDetailPage,
    getASINFromCurrentURL,
    getProductDetailsFromPage,
    extractGalleryImages,
    version: '1.0.0'
};

console.log('✅ AMZ Extractor ALL enhanced content script loaded');