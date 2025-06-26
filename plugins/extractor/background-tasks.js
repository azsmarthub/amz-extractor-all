// plugins/extractor/background-tasks.js
// Background processing coordination for extraction

export class BackgroundTasks {
  
  static async extractAll(asinArray) {
    console.log('🚀 Starting complete extraction for ASINs:', asinArray);
    
    try {
      // Initialize extraction status
      await this.initializeExtractionStatus(asinArray);
      
      // Step 1: Extract images
      this.updateProgress('Starting image extraction...', 0);
      const imageResults = await this.extractImages(asinArray);
      
      // Step 2: Process data
      this.updateProgress('Processing extracted data...', 50);
      const processedData = await this.processData(imageResults, asinArray);
      
      // Step 3: Finalize results
      this.updateProgress('Finalizing results...', 90);
      const finalResults = await this.finalizeResults(imageResults, processedData);
      
      // Step 4: Complete
      this.updateProgress('Extraction completed!', 100);
      await this.markExtractionComplete(finalResults);
      
      return finalResults;
      
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      await this.markExtractionFailed(error);
      throw error;
    }
  }
  
  // Initialize extraction tracking
  static async initializeExtractionStatus(asins) {
    const status = {
      inProgress: true,
      startTime: Date.now(),
      stage: 'initializing',
      progress: 0,
      asins: asins,
      totalSteps: 4,
      currentStep: 1,
      stepProgress: 0,
      message: 'Preparing extraction...',
      results: null,
      error: null
    };
    
    await chrome.storage.local.set({ extractionStatus: status });
    console.log('📊 Extraction status initialized');
  }
  
  // Update progress for UI
  static async updateProgress(message, progress, step = null) {
    const status = await chrome.storage.local.get('extractionStatus');
    const currentStatus = status.extractionStatus || {};
    
    const updatedStatus = {
      ...currentStatus,
      message: message,
      progress: progress,
      stepProgress: progress,
      lastUpdate: Date.now()
    };
    
    if (step !== null) {
      updatedStatus.currentStep = step;
      updatedStatus.stage = this.getStageFromStep(step);
    }
    
    await chrome.storage.local.set({ extractionStatus: updatedStatus });
    
    // Notify popup if it's listening
    try {
      chrome.runtime.sendMessage({
        type: 'EXTRACTION_PROGRESS',
        data: updatedStatus
      });
    } catch (e) {
      // Popup might not be open, ignore
    }
  }
  
  static getStageFromStep(step) {
    const stages = {
      1: 'initializing',
      2: 'extracting_images',
      3: 'processing_data',
      4: 'finalizing'
    };
    return stages[step] || 'unknown';
  }
  
  // Extract images using image-extractor plugin
  static async extractImages(asins) {
    console.log('📷 Starting image extraction for', asins.length, 'ASINs');
    
    try {
      await this.updateProgress('Extracting images...', 10, 2);
      
      // Load image extractor
      const { ImageExtractor } = await import('./image-extractor.js');
      
      const allImages = [];
      
      for (let i = 0; i < asins.length; i++) {
        const asin = asins[i];
        const stepProgress = 10 + (35 * (i / asins.length));
        
        await this.updateProgress(`Extracting images for ${asin}...`, stepProgress);
        
        try {
          const images = await ImageExtractor.extractImagesForASIN(asin);
          allImages.push(...images);
          
          console.log(`✅ Extracted ${images.length} images for ${asin}`);
          
        } catch (error) {
          console.error(`❌ Failed to extract images for ${asin}:`, error);
          // Continue with other ASINs
        }
        
        // Rate limiting
        if (i < asins.length - 1) {
          await this.sleep(2000);
        }
      }
      
      await this.updateProgress('Image extraction completed', 45);
      
      console.log(`📷 Total images extracted: ${allImages.length}`);
      
      return {
        images: allImages,
        stats: {
          total_images: allImages.length,
          asins_processed: asins.length,
          extracted_at: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Image extraction failed:', error);
      throw new Error(`Image extraction failed: ${error.message}`);
    }
  }
  
  // Process extracted data using data-processor
  static async processData(imageResults, asins) {
    console.log('🔄 Starting data processing...');
    
    try {
      await this.updateProgress('Processing extracted data...', 50, 3);
      
      // Load data processor
      const { DataProcessor } = await import('./data-processor.js');
      
      const extractionData = {
        images: imageResults.images,
        asins: asins
      };
      
      await this.updateProgress('Analyzing products...', 60);
      const processedData = await DataProcessor.processExtractedData(extractionData);
      
      await this.updateProgress('Generating insights...', 75);
      
      console.log('✅ Data processing completed');
      console.log('📊 Processed products:', processedData.processed_products.length);
      console.log('📈 Strategy generated:', !!processedData.product_strategy);
      console.log('📦 Content packages:', Object.keys(processedData.content_ready_packages).length);
      
      return processedData;
      
    } catch (error) {
      console.error('❌ Data processing failed:', error);
      throw new Error(`Data processing failed: ${error.message}`);
    }
  }
  
  // Finalize and structure results
  static async finalizeResults(imageResults, processedData) {
    console.log('✨ Finalizing extraction results...');
    
    try {
      await this.updateProgress('Finalizing results...', 90, 4);
      
      const finalResults = {
        // Source info
        source: 'amz-extractor-all',
        version: '1.0.0',
        extraction_id: this.generateExtractionId(),
        timestamp: new Date().toISOString(),
        
        // Raw extraction data
        raw_data: {
          images: imageResults.images,
          image_stats: imageResults.stats
        },
        
        // Processed analysis
        analysis: {
          processed_products: processedData.processed_products,
          product_strategy: processedData.product_strategy,
          processing_stats: processedData.processing_stats
        },
        
        // Content packages
        content: processedData.content_ready_packages,
        
        // Summary statistics
        summary: {
          total_asins: processedData.processed_products.length,
          total_images: imageResults.stats.total_images,
          avg_images_per_product: imageResults.stats.total_images / processedData.processed_products.length,
          processing_time_ms: Date.now() - (await this.getExtractionStartTime()),
          quality_scores: processedData.processed_products.map(p => p.analysis.image_quality_score)
        }
      };
      
      // Save complete results
      await chrome.storage.local.set({
        extractorResults: finalResults,
        lastExtractionTime: Date.now()
      });
      
      console.log('💾 Results saved to storage');
      
      return finalResults;
      
    } catch (error) {
      console.error('❌ Results finalization failed:', error);
      throw new Error(`Results finalization failed: ${error.message}`);
    }
  }
  
  // Mark extraction as complete
  static async markExtractionComplete(results) {
    const status = await chrome.storage.local.get('extractionStatus');
    const currentStatus = status.extractionStatus || {};
    
    const completedStatus = {
      ...currentStatus,
      inProgress: false,
      completed: true,
      progress: 100,
      message: 'Extraction completed successfully!',
      results: results,
      completedAt: Date.now(),
      duration: Date.now() - currentStatus.startTime
    };
    
    await chrome.storage.local.set({ extractionStatus: completedStatus });
    
    // Notify popup
    try {
      chrome.runtime.sendMessage({
        type: 'EXTRACTION_COMPLETE',
        data: completedStatus
      });
    } catch (e) {
      // Popup might not be open
    }
    
    console.log('✅ Extraction marked as complete');
  }
  
  // Mark extraction as failed
  static async markExtractionFailed(error) {
    const status = await chrome.storage.local.get('extractionStatus');
    const currentStatus = status.extractionStatus || {};
    
    const failedStatus = {
      ...currentStatus,
      inProgress: false,
      failed: true,
      progress: 0,
      message: `Extraction failed: ${error.message}`,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      },
      failedAt: Date.now()
    };
    
    await chrome.storage.local.set({ extractionStatus: failedStatus });
    
    // Notify popup
    try {
      chrome.runtime.sendMessage({
        type: 'EXTRACTION_FAILED',
        data: failedStatus
      });
    } catch (e) {
      // Popup might not be open
    }
    
    console.log('❌ Extraction marked as failed');
  }
  
  // Send results to webhook
  static async sendToWebhook(results, keywords) {
    console.log('📤 Sending results to webhook...');
    
    try {
      // Load webhook manager
      const { WebhookManager } = await import('../../shared/webhook.js');
      
      // Prepare enhanced payload
      const payload = {
        // Basic ASIN data (for backward compatibility)
        amazon_keywords: keywords,
        asin_top3: results.analysis.processed_products.slice(0, 3).map(p => p.asin).join(','),
        asin_list: results.analysis.processed_products.map(p => p.asin).join(','),
        
        // Enhanced extraction data
        source: results.source,
        version: results.version,
        extraction_id: results.extraction_id,
        timestamp: results.timestamp,
        
        extraction_data: {
          images: results.raw_data.images,
          processed_products: results.analysis.processed_products,
          product_strategy: results.analysis.product_strategy,
          content_ready_packages: results.content
        },
        
        summary: results.summary
      };
      
      const response = await WebhookManager.sendEnhanced(payload);
      
      console.log('✅ Webhook sent successfully:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Webhook sending failed:', error);
      throw error;
    }
  }
  
  // Get current extraction status
  static async getExtractionStatus() {
    const status = await chrome.storage.local.get('extractionStatus');
    return status.extractionStatus || null;
  }
  
  // Clear extraction status
  static async clearExtractionStatus() {
    await chrome.storage.local.remove('extractionStatus');
    console.log('🧹 Extraction status cleared');
  }
  
  // Get latest results
  static async getLatestResults() {
    const data = await chrome.storage.local.get('extractorResults');
    return data.extractorResults || null;
  }
  
  // Helper functions
  static async getExtractionStartTime() {
    const status = await chrome.storage.local.get('extractionStatus');
    return status.extractionStatus?.startTime || Date.now();
  }
  
  static generateExtractionId() {
    return 'ext_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Retry logic for failed extractions
  static async retryExtraction(asinArray, maxRetries = 2) {
    console.log(`🔄 Retrying extraction (max ${maxRetries} attempts)...`);
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📝 Extraction attempt ${attempt}/${maxRetries}`);
        
        // Clear previous status
        await this.clearExtractionStatus();
        
        // Retry extraction
        const results = await this.extractAll(asinArray);
        
        console.log(`✅ Extraction succeeded on attempt ${attempt}`);
        return results;
        
      } catch (error) {
        console.error(`❌ Extraction attempt ${attempt} failed:`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting before retry attempt ${attempt + 1}...`);
          await this.sleep(5000); // Wait 5 seconds before retry
        }
      }
    }
    
    console.error(`❌ All ${maxRetries} extraction attempts failed`);
    throw lastError;
  }
  
  // Background extraction management
  static async startBackgroundExtraction(asinArray) {
    console.log('🎬 Starting background extraction...');
    
    // Send to background script for processing
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'START_EXTRACTION',
        data: { asins: asinArray }
      }, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Background extraction failed'));
        }
      });
    });
  }
  
  // Listen for background extraction updates
  static setupProgressListener(onProgress, onComplete, onError) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'EXTRACTION_PROGRESS':
          if (onProgress) onProgress(message.data);
          break;
          
        case 'EXTRACTION_COMPLETE':
          if (onComplete) onComplete(message.data);
          break;
          
        case 'EXTRACTION_FAILED':
          if (onError) onError(message.data);
          break;
      }
    });
    
    console.log('👂 Progress listener setup complete');
  }
}

// Export for different contexts
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // Extension context
  globalThis.BackgroundTasks = BackgroundTasks;
} else {
  // Module context
  export default BackgroundTasks;
}