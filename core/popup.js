// Enhanced popup script for AMZ Extractor ALL
// Integrates ASIN Collection + Plugin Extraction

document.addEventListener('DOMContentLoaded', function () {
  console.log('🚀 AMZ Extractor ALL popup script loaded v1.0.0');
  
  // Core Elements (existing)
  const asinListBody = document.getElementById('asin-list');
  const asinCount = document.getElementById('asin-count');
  const emptyState = document.getElementById('empty-state');
  const asinTable = document.getElementById('asin-table');
  const keywordInput = document.getElementById('keyword-input');
  const submitKeywords = document.getElementById('submit-keywords');
  const currentKeywords = document.getElementById('current-keywords');
  const keywordsDisplay = document.getElementById('keywords-display');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  
  // New Extraction Elements
  const extractionSection = document.getElementById('extraction-section');
  const extractBtn = document.getElementById('extract-btn');
  const extractionProgress = document.getElementById('extraction-progress');
  const extractionResults = document.getElementById('extraction-results');
  const previewResults = document.getElementById('preview-results');
  const sendEnhanced = document.getElementById('send-enhanced');
  const saveResults = document.getElementById('save-results');
  const progressStats = document.getElementById('progress-stats');
  const productCount = document.getElementById('product-count');
  const imageCount = document.getElementById('image-count');

  // Default webhook settings - Enhanced for AMZ Extractor ALL
  const DEFAULT_WEBHOOK_SETTINGS = {
    url: 'https://n8n.azsmarthub.com/webhook/amz-extractor-all',
    username: 'amzextractor',
    password: 'UFjSooyolve8zjF2mn7Q',
    mode: 'enhanced'
  };

  // ============= PLUGIN COORDINATION =============
  
  class ExtractorPlugin {
    constructor() {
      this.progressCallbacks = [];
      this.completeCallbacks = [];
      this.extractionResults = null;
    }
    
    async extract(asinArray) {
      console.log('🎯 Plugin: Starting extraction for ASINs:', asinArray);
      
      if (!Array.isArray(asinArray) || asinArray.length === 0) {
        throw new Error('Invalid ASIN array provided');
      }
      
      // Validate ASINs
      const invalidASINs = asinArray.filter(asin => !Utils.validateASIN(asin));
      if (invalidASINs.length > 0) {
        throw new Error(`Invalid ASINs: ${invalidASINs.join(', ')}`);
      }
      
      try {
        // Start background extraction
        const response = await Utils.sendMessage({
          type: 'EXTRACT_IMAGES',
          asins: asinArray
        });
        
        if (!response || !response.success) {
          throw new Error(response?.error || 'Failed to start extraction');
        }
        
        // Monitor progress
        return await this.monitorProgress();
        
      } catch (error) {
        console.error('Plugin extraction error:', error);
        throw error;
      }
    }
    
    async monitorProgress() {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(async () => {
          try {
            const status = await StorageManager.getExtractionStatus();
            
            if (!status) {
              clearInterval(checkInterval);
              reject(new Error('Extraction status lost'));
              return;
            }
            
            // Notify progress callbacks
            this.progressCallbacks.forEach(callback => callback(status));
            
            if (!status.inProgress) {
              clearInterval(checkInterval);
              
              // Get final results
              const results = await StorageManager.getExtractionResults();
              this.extractionResults = results;
              
              // Notify completion callbacks
              this.completeCallbacks.forEach(callback => callback(results));
              
              // Clean up status
              await StorageManager.clearExtractionStatus();
              
              resolve(results);
            }
          } catch (error) {
            clearInterval(checkInterval);
            reject(error);
          }
        }, 1000);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Extraction timeout'));
        }, 300000);
      });
    }
    
    onProgressUpdate(callback) {
      this.progressCallbacks.push(callback);
    }
    
    onComplete(callback) {
      this.completeCallbacks.push(callback);
    }
    
    getResults() {
      return this.extractionResults;
    }
  }

  // Initialize plugin
  const extractorPlugin = new ExtractorPlugin();
  window.extractorPlugin = extractorPlugin;

  // ============= EXISTING ASIN COLLECTOR LOGIC =============

  // Track manual deletions to prevent double rendering
  let isManualDelete = false;
  
  // Password encoding/decoding (from original)
  function encodePassword(password) {
    try {
      return btoa(password.split('').reverse().join(''));
    } catch (e) {
      return password;
    }
  }

  function decodePassword(encodedPassword) {
    try {
      return atob(encodedPassword).split('').reverse().join('');
    } catch (e) {
      return encodedPassword;
    }
  }

  function initializeWebhookSettings() {
    StorageManager.getWebhookConfig().then(settings => {
      if (!settings || Object.keys(settings).length === 0) {
        console.log('⚠️ No settings found, creating defaults...');
        const defaultSettings = { ...DEFAULT_WEBHOOK_SETTINGS };
        defaultSettings.password = encodePassword(defaultSettings.password);
        StorageManager.setWebhookConfig(defaultSettings).then(() => {
          console.log('✅ Default settings created');
          populateSettingsForm(defaultSettings);
        });
      } else {
        populateSettingsForm(settings);
      }
    });
  }

  function populateSettingsForm(settings) {
    const urlField = document.getElementById('webhook-url');
    const usernameField = document.getElementById('webhook-username');
    const passwordField = document.getElementById('webhook-password');
    const modeField = document.getElementById('webhook-mode');
    
    if (urlField && usernameField && passwordField && modeField) {
      urlField.value = settings.url || DEFAULT_WEBHOOK_SETTINGS.url;
      usernameField.value = settings.username || DEFAULT_WEBHOOK_SETTINGS.username;
      
      let passwordValue;
      if (settings.password) {
        passwordValue = decodePassword(settings.password);
      } else {
        passwordValue = DEFAULT_WEBHOOK_SETTINGS.password;
      }
      passwordField.value = passwordValue;
      modeField.value = settings.mode || DEFAULT_WEBHOOK_SETTINGS.mode;
      
      // Force defaults if any field is empty
      if (!urlField.value) urlField.value = DEFAULT_WEBHOOK_SETTINGS.url;
      if (!usernameField.value) usernameField.value = DEFAULT_WEBHOOK_SETTINGS.username;
      if (!passwordField.value) passwordField.value = DEFAULT_WEBHOOK_SETTINGS.password;
      
      console.log('✅ Settings populated');
    }
  }

  function validateKeywords(input) {
    const keywords = input.trim().split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (keywords.length === 0) {
      return { valid: false, error: 'Please enter at least 1 keyword' };
    }
    if (keywords.length > 2) {
      return { valid: false, error: 'Maximum 2 keywords allowed' };
    }
    return { valid: true, keywords: keywords, originalInput: input.trim() };
  }

  function createClickableKeywords(keywordString) {
    keywordsDisplay.innerHTML = '';
    
    const parts = keywordString.split(',');
    const keywords = parts.map(k => k.trim());
    
    const keywordsContainer = document.createElement('span');
    keywordsContainer.className = 'keywords-container';
    
    parts.forEach((part, index) => {
      const keyword = keywords[index];
      
      const keywordSpan = document.createElement('span');
      keywordSpan.className = 'clickable-keyword';
      keywordSpan.textContent = part;
      keywordSpan.title = 'Click to copy: ' + keyword;
      
      keywordSpan.onclick = function(e) {
        e.stopPropagation();
        Utils.copyToClipboard(keyword).then(() => {
          showToast(`Copied: ${keyword}`);
          
          this.style.color = '#10b981';
          this.style.fontWeight = '600';
          setTimeout(() => {
            this.style.color = '';
            this.style.fontWeight = '';
          }, 800);
        });
      };
      
      keywordsContainer.appendChild(keywordSpan);
      
      if (index < parts.length - 1) {
        keywordsContainer.appendChild(document.createTextNode(','));
      }
    });
    
    const copyAllIcon = document.createElement('span');
    copyAllIcon.className = 'copy-all-keywords';
    copyAllIcon.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
      </svg>
    `;
    copyAllIcon.title = 'Copy all keywords: ' + keywordString;
    
    copyAllIcon.onclick = function(e) {
      e.stopPropagation();
      Utils.copyToClipboard(keywordString).then(() => {
        showToast(`Copied all: ${keywordString}`);
        
        this.style.color = '#10b981';
        this.style.transform = 'scale(1.1)';
        setTimeout(() => {
          this.style.color = '';
          this.style.transform = '';
        }, 600);
      });
    };
    
    keywordsDisplay.appendChild(keywordsContainer);
    keywordsDisplay.appendChild(copyAllIcon);
  }

  function openSearchTabs(keywords) {
    keywords.forEach(keyword => {
      const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
      chrome.tabs.create({ url: searchUrl });
    });
  }

  function classifyASINs(asinList) {
    return {
      top3: asinList.slice(0, 3),
      others: asinList.slice(3)
    };
  }

  function setLoadingState(element, isLoading) {
    if (isLoading) {
      element.classList.add('loading');
    } else {
      element.classList.remove('loading');
    }
  }

  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    
    if (type === 'error') {
      toast.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)';
    } else {
      toast.style.background = 'linear-gradient(135deg, rgba(17, 176, 33, 0.9) 0%, rgba(17, 155, 33, 0.9) 100%)';
    }
    toast.style.color = '#fff';
    
    toast.className = 'show';
    
    setTimeout(() => {
      toast.className = '';
    }, 2500);
  }

  function renderTable(asinList) {
    setLoadingState(asinListBody, true);
    
    setTimeout(() => {
      asinListBody.innerHTML = '';
      
      if (asinList.length === 0) {
        emptyState.style.display = 'block';
        asinTable.style.display = 'none';
        hideExtractionSection();
      } else {
        emptyState.style.display = 'none';
        asinTable.style.display = 'table';
        
        const classified = classifyASINs(asinList);
        
        classified.top3.forEach(function(item, idx) {
          renderASINRow(item, idx, 'TOP 3', asinList);
        });
        
        classified.others.forEach(function(item, idx) {
          renderASINRow(item, idx + 3, 'OTHERS', asinList);
        });
        
        // Show extraction section if we have exactly 3 TOP 3 items
        if (classified.top3.length === 3) {
          showExtractionSection();
        } else {
          hideExtractionSection();
        }
      }
      
      updateAsinCount(asinList.length);
      setLoadingState(asinListBody, false);
    }, 50);
  }

  function renderASINRow(item, globalIndex, group, fullList) {
    const tr = document.createElement('tr');
    
    tr.classList.add(group === 'TOP 3' ? 'top3-row' : 'others-row');
    
    tr.style.opacity = '0';
    tr.style.transform = 'translateY(8px)';
    tr.style.transition = `all 0.25s ease ${globalIndex * 0.02}s`;
    
    tr.innerHTML = `
      <td style="font-weight: 600; color: #6b7280; font-size: 0.8em; text-align: center;">${globalIndex + 1}</td>
      <td class="group-cell">
        <span class="group-badge ${group === 'TOP 3' ? 'top3-badge' : 'others-badge'}">${group}</span>
      </td>
      <td class="thumb-cell">
        <img src="${item.img || ''}" alt="" class="thumb" 
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDIiIGhlaWdodD0iNDIiIHZpZXdCb3g9IjAgMCA0MiA0MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQyIiBoZWlnaHQ9IjQyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMSAzMkMyNy42Mjc0IDMyIDMyIDI3LjYyNzQgMzIgMjFDMzIgMTQuMzcyNiAyNy42Mjc0IDEwIDIxIDEwQzE0LjM3MjYgMTAgMTAgMTQuMzcyNiAxMCAyMUMxMCAyNy42Mjc0IDE0LjM3MjYgMzIgMjEgMzJaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTggMThMMjQgMjQiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9wYXRoPgo8cGF0aCBkPSJNMjQgMThMMTggMjQiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg=='" />
      </td>
      <td class="title-cell" title="${item.title ? item.title : 'No Title'}">
        ${item.title ? item.title : '<span class="empty-title">No Title</span>'}
      </td>
      <td class="asin-cell" title="Click to copy ASIN">${item.asin}</td>
      <td>
        <a href="${item.link}" target="_blank" rel="noopener" title="Open product">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5" fill="white"/>
            <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z" fill="white"/>
          </svg>
        </a>
      </td>
      <td>
        <button class="delete-btn" title="Remove this ASIN">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" fill="white"/>
          </svg>
        </button>
      </td>
    `;
    
    asinListBody.appendChild(tr);
    
    requestAnimationFrame(() => {
      tr.style.opacity = '1';
      tr.style.transform = 'translateY(0)';
    });
    
    // Add click to copy ASIN functionality
    const asinCell = tr.querySelector('.asin-cell');
    asinCell.addEventListener('click', () => {
      Utils.copyToClipboard(item.asin).then(() => {
        showToast(`Copied: ${item.asin}`);
      });
    });
    
    // Delete button functionality
    tr.querySelector('.delete-btn').onclick = function () {
      isManualDelete = true;
      
      tr.style.transform = 'translateX(-50px)';
      tr.style.opacity = '0';
      
      setTimeout(async () => {
        try {
          const asinList = await StorageManager.getASINList();
          const updatedList = asinList.filter(listItem => listItem.asin !== item.asin);
          
          await StorageManager.setASINList(updatedList);
          tr.remove();
          updateAsinCount(updatedList.length);
          showToast('Removed');
          
          if (updatedList.length === 0) {
            emptyState.style.display = 'block';
            asinTable.style.display = 'none';
            hideExtractionSection();
          }
          
          // Update row numbers
          const remainingRows = asinListBody.querySelectorAll('tr');
          remainingRows.forEach((row, newIdx) => {
            const numberCell = row.querySelector('td:first-child');
            if (numberCell) {
              numberCell.textContent = newIdx + 1;
            }
          });
          
          sendMessageToContentScript('UPDATE_ASIN_BUTTONS');
          
          setTimeout(() => {
            isManualDelete = false;
          }, 100);
        } catch (error) {
          console.error('Delete error:', error);
          isManualDelete = false;
        }
      }, 250);
    };
  }

  function updateAsinCount(newCount) {
    const countElement = document.querySelector('#count-number');
    const currentCount = parseInt(countElement.textContent) || 0;
    
    if (newCount !== currentCount) {
      const container = document.querySelector('#asin-count');
      container.style.transform = 'scale(1.1)';
      
      setTimeout(() => {
        countElement.textContent = newCount;
        container.style.transform = 'scale(1)';
      }, 80);
    }
  }

  function sendMessageToContentScript(type, data = {}) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('amazon.')) {
        chrome.tabs.sendMessage(tabs[0].id, {type: type, ...data}, function(response) {
          if (chrome.runtime.lastError) {
            console.log('Message sending failed:', chrome.runtime.lastError.message);
          }
        });
      }
    });
  }

  // ============= NEW: EXTRACTION FUNCTIONS =============
  
  function showExtractionSection() {
    if (extractionSection) {
      extractionSection.style.display = 'block';
      console.log('✅ Extraction section shown - 3 TOP ASINs ready');
    }
  }
  
  function hideExtractionSection() {
    if (extractionSection) {
      extractionSection.style.display = 'none';
    }
    hideExtractionProgress();
    hideExtractionResults();
  }
  
  function showExtractionProgress() {
    if (extractionProgress) {
      extractionProgress.style.display = 'block';
    }
    hideExtractionSection();
    hideExtractionResults();
  }
  
  function hideExtractionProgress() {
    if (extractionProgress) {
      extractionProgress.style.display = 'none';
    }
  }
  
  function showExtractionResults() {
    if (extractionResults) {
      extractionResults.style.display = 'block';
    }
    hideExtractionProgress();
    hideExtractionSection();
  }
  
  function hideExtractionResults() {
    if (extractionResults) {
      extractionResults.style.display = 'none';
    }
  }
  
  function updateExtractionProgress(status) {
    if (!status) return;
    
    const percentage = Math.round((status.processed / status.total) * 100);
    
    // Update progress bar
    const progressBar = document.querySelector('.progress-bar');
    const progressPercent = document.querySelector('.progress-percent');
    const currentTask = document.querySelector('.current-task');
    
    if (progressBar) progressBar.style.width = percentage + '%';
    if (progressPercent) progressPercent.textContent = percentage + '%';
    if (currentTask) currentTask.textContent = status.currentMessage || 'Processing...';
    
    // Update stats
    if (progressStats) {
      progressStats.innerHTML = `
        <span>✅ ${status.successful}</span>
        <span>❌ ${status.failed}</span>
        <span>🔄 ${status.processed}/${status.total}</span>
      `;
      progressStats.style.display = 'flex';
    }
  }
  
  function updateExtractionResults(results) {
    if (!results) return;
    
    const imageCount = results.images ? results.images.reduce((sum, item) => sum + (item.images?.length || 0), 0) : 0;
    const productCount = results.productData ? results.productData.length : 0;
    
    // Update result stats
    if (document.getElementById('product-count')) {
      document.getElementById('product-count').textContent = productCount;
    }
    if (document.getElementById('image-count')) {
      document.getElementById('image-count').textContent = imageCount;
    }
    
    console.log('📊 Extraction results updated:', { productCount, imageCount });
  }

  // ============= EXISTING BUTTON HANDLERS =============

  submitKeywords.onclick = function() {
    const input = keywordInput.value.trim();
    const validation = validateKeywords(input);
    
    if (!validation.valid) {
      showToast(validation.error, 'error');
      return;
    }

    setLoadingState(this, true);
    
    const originalFormat = validation.originalInput;
    
    StorageManager.setKeywords(originalFormat).then(() => {
      createClickableKeywords(originalFormat);
      currentKeywords.style.display = 'block';
      keywordInput.value = '';
      
      openSearchTabs(validation.keywords);
      
      showToast(`Opened ${validation.keywords.length} search tabs`);
      setLoadingState(submitKeywords, false);
    });
  };

  keywordInput.onkeypress = function(e) {
    if (e.key === 'Enter') {
      submitKeywords.click();
    }
  };

  settingsBtn.onclick = function() {
    settingsPanel.style.display = 'block';
    setTimeout(() => {
      console.log('🔧 Opening settings panel...');
      initializeWebhookSettings();
    }, 10);
  };

  document.getElementById('close-settings').onclick = function() {
    settingsPanel.style.display = 'none';
  };

  document.getElementById('settings-panel').addEventListener('click', function(e) {
    if (e.target === this) {
      this.style.display = 'none';
    }
  });

  document.getElementById('save-settings').onclick = function() {
    const settings = {
      url: document.getElementById('webhook-url').value.trim(),
      username: document.getElementById('webhook-username').value.trim(),
      password: encodePassword(document.getElementById('webhook-password').value.trim()),
      mode: document.getElementById('webhook-mode').value
    };

    StorageManager.setWebhookConfig(settings).then(() => {
      showToast('✅ Settings saved & encrypted');
      settingsPanel.style.display = 'none';
      console.log('✅ Webhook settings saved');
    });
  };

  document.getElementById('reset-settings').onclick = function() {
    const defaultSettings = { ...DEFAULT_WEBHOOK_SETTINGS };
    defaultSettings.password = encodePassword(defaultSettings.password);
    
    StorageManager.setWebhookConfig(defaultSettings).then(() => {
      populateSettingsForm(defaultSettings);
      showToast('🔄 Settings reset to default');
      console.log('✅ Settings reset to defaults');
    });
  };

  document.getElementById('test-webhook').onclick = async function() {
    const button = this;
    const originalText = button.innerHTML;
    
    setLoadingState(button, true);
    button.innerHTML = '🔄 Testing...';
    
    try {
      const url = document.getElementById('webhook-url').value.trim();
      const username = document.getElementById('webhook-username').value.trim();
      const password = document.getElementById('webhook-password').value.trim();
      
      const result = await WebhookManager.testConnection(url, username, password);
      
      if (result.success) {
        button.innerHTML = '✅ Connected!';
        button.style.background = '#10b981';
        showToast(`Webhook test successful (${result.status})`);
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.background = '';
        }, 2000);
      } else {
        button.innerHTML = '❌ Failed';
        button.style.background = '#ef4444';
        showToast(`Test failed: ${result.error}`, 'error');
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.background = '';
        }, 3000);
      }
    } catch (error) {
      button.innerHTML = '❌ Error';
      button.style.background = '#ef4444';
      showToast(`Test error: ${error.message}`, 'error');
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
      }, 3000);
    }
    
    setLoadingState(button, false);
  };

  document.getElementById('copy-top3').onclick = function () {
    const button = this;
    setLoadingState(button, true);
    
    StorageManager.getASINList().then(asinList => {
      const classified = classifyASINs(asinList);
      
      if (classified.top3.length === 0) {
        showToast('No TOP 3 ASINs to copy');
        setLoadingState(button, false);
        return;
      }
      
      const txt = classified.top3.map(item => item.asin).join(',');
      Utils.copyToClipboard(txt).then(() => {
        showToast(`Copied ${classified.top3.length} TOP 3 ASINs`);
        setLoadingState(button, false);
      });
    });
  };

  document.getElementById('copy-others').onclick = function () {
    const button = this;
    setLoadingState(button, true);
    
    StorageManager.getASINList().then(asinList => {
      const classified = classifyASINs(asinList);
      
      if (classified.others.length === 0) {
        showToast('No OTHER ASINs to copy');
        setLoadingState(button, false);
        return;
      }
      
      const txt = classified.others.map(item => item.asin).join(',');
      Utils.copyToClipboard(txt).then(() => {
        showToast(`Copied ${classified.others.length} OTHER ASINs`);
        setLoadingState(button, false);
      });
    });
  };

  document.getElementById('copy-all').onclick = function () {
    const button = this;
    setLoadingState(button, true);
    
    StorageManager.getASINList().then(asinList => {
      if (asinList.length === 0) {
        showToast('No ASINs to copy');
        setLoadingState(button, false);
        return;
      }
      
      const txt = asinList.map(item => item.asin).join(',');
      Utils.copyToClipboard(txt).then(() => {
        showToast(`Copied ${asinList.length} ASINs`);
        setLoadingState(button, false);
      });
    });
  };

  document.getElementById('send-webhook').onclick = async function () {
    const button = this;
    setLoadingState(button, true);
    
    try {
      const result = await WebhookManager.sendBasic();
      
      if (result.success) {
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
          </svg>
          SENT
        `;
        button.style.background = '#10b981';
        
        showToast('Basic data sent successfully!');
        
        setTimeout(() => {
          button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.854.146a.5.5 0 0 1 .11.54L13.026 8.99A.5.5 0 0 1 12.5 9.5h-2A1.5 1.5 0 0 0 9 11v2a.5.5 0 0 1-.49.474L.146.146A.5.5 0 0 1 .5 0h15a.5.5 0 0 1 .354.146z"/>
            </svg>
            BASIC
          `;
          button.style.background = '';
        }, 3000);
        
      } else {
        showToast(`Send failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast(`Send error: ${error.message}`, 'error');
    }
    
    setLoadingState(button, false);
  };

  document.getElementById('clear-all').onclick = function () {
    const button = this;
    
    StorageManager.getASINList().then(asinList => {
      if (asinList.length === 0) {
        showToast('List is already empty');
        return;
      }
      
      setLoadingState(button, true);
      
      Promise.all([
        StorageManager.setASINList([]),
        StorageManager.setKeywords(''),
        StorageManager.clearExtractionData()
      ]).then(() => {
        setTimeout(() => {
          renderTable([]);
          currentKeywords.style.display = 'none';
          keywordsDisplay.innerHTML = '';
          hideExtractionSection();
          hideExtractionProgress();
          hideExtractionResults();
          showToast('All data cleared!');
          setLoadingState(button, false);
          
          sendMessageToContentScript('CLEAR_ALL_ASIN');
        }, 100);
      });
    });
  };

  // ============= NEW: EXTRACTION BUTTON HANDLERS =============

  if (extractBtn) {
    extractBtn.onclick = async function() {
      console.log('🎯 Extract button clicked');
      
      try {
        const asinList = await StorageManager.getASINList();
        const classified = classifyASINs(asinList);
        
        if (classified.top3.length !== 3) {
          showToast('Need exactly 3 TOP ASINs for extraction', 'error');
          return;
        }
        
        const top3ASINs = classified.top3.map(item => item.asin);
        
        setLoadingState(this, true);
        this.disabled = true;
        this.innerHTML = '🔄 Starting Extraction...';
        
        showExtractionProgress();
        
        // Setup progress monitoring
        extractorPlugin.onProgressUpdate(updateExtractionProgress);
        extractorPlugin.onComplete((results) => {
          console.log('🎉 Extraction completed:', results);
          updateExtractionResults(results);
          showExtractionResults();
          
          // Reset button
          extractBtn.disabled = false;
          extractBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            🔍 Extract Images & Data
          `;
          setLoadingState(extractBtn, false);
        });
        
        // Start extraction
        await extractorPlugin.extract(top3ASINs);
        
      } catch (error) {
        console.error('Extraction error:', error);
        showToast(`Extraction failed: ${error.message}`, 'error');
        
        // Reset button on error
        extractBtn.disabled = false;
        extractBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          🔍 Extract Images & Data
        `;
        setLoadingState(extractBtn, false);
        hideExtractionProgress();
        showExtractionSection();
      }
    };
  }

  if (sendEnhanced) {
    sendEnhanced.onclick = async function() {
      const button = this;
      setLoadingState(button, true);
      
      try {
        const result = await WebhookManager.sendEnhanced();
        
        if (result.success) {
          button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
            </svg>
            ✅ SENT
          `;
          button.style.background = '#10b981';
          
          showToast('Enhanced data sent successfully!');
          
          setTimeout(() => {
            button.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" stroke-width="2"/>
                <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="currentColor" stroke-width="2"/>
              </svg>
              📤 Send Enhanced
            `;
            button.style.background = '';
          }, 3000);
          
        } else {
          showToast(`Enhanced send failed: ${result.error}`, 'error');
        }
      } catch (error) {
        showToast(`Enhanced send error: ${error.message}`, 'error');
      }
      
      setLoadingState(button, false);
    };
  }

  if (previewResults) {
    previewResults.onclick = function() {
      const results = extractorPlugin.getResults();
      if (results) {
        console.log('📋 Preview results:', results);
        // TODO: Open results in new tab (will be implemented in Phase 3)
        showToast('Results preview (coming in Phase 3)');
      } else {
        showToast('No results to preview', 'error');
      }
    };
  }

  if (saveResults) {
    saveResults.onclick = async function() {
      try {
        const results = extractorPlugin.getResults();
        if (results) {
          await StorageManager.setExtractionResults(results);
          showToast('Results saved successfully!');
        } else {
          showToast('No results to save', 'error');
        }
      } catch (error) {
        showToast(`Save failed: ${error.message}`, 'error');
      }
    };
  }

  // ============= INITIALIZATION =============

  Promise.all([
    StorageManager.getASINList(),
    StorageManager.getKeywords()
  ]).then(([asinList, keywords]) => {
    renderTable(asinList);
    
    if (keywords) {
      createClickableKeywords(keywords);
      currentKeywords.style.display = 'block';
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.asinList && !isManualDelete) {
      const newList = changes.asinList.newValue || [];
      renderTable(newList);
      
      if (document.hasFocus()) {
        const oldLength = changes.asinList.oldValue ? changes.asinList.oldValue.length : 0;
        const newLength = newList.length;
        
        if (newLength > oldLength) {
          const classification = newLength <= 3 ? 'TOP 3' : 'OTHERS';
          showToast(`Added to ${classification} (${newLength - oldLength} item)`);
        } else if (newLength < oldLength && !isManualDelete) {
          showToast(`Removed ${oldLength - newLength} item(s)`);
        }
      }
    }
  });

  console.log('🎨 AMZ Extractor ALL popup with enhanced extraction loaded');
});