// plugins/extractor/results-manager.js
// Results management and display for extraction data

export class ResultsManager {
  
  // Display results in popup UI
  static async displayResults(results) {
    console.log('📊 Displaying extraction results...');
    
    try {
      // Update results stats
      this.updateResultsStats(results);
      
      // Show results section
      this.showResultsSection();
      
      // Populate results preview
      this.populateResultsPreview(results);
      
      // Setup results actions
      this.setupResultsActions(results);
      
      console.log('✅ Results displayed successfully');
      
    } catch (error) {
      console.error('❌ Failed to display results:', error);
      this.showResultsError(error);
    }
  }
  
  // Update stats display
  static updateResultsStats(results) {
    const productCount = document.getElementById('product-count');
    const imageCount = document.getElementById('image-count');
    
    if (productCount) {
      productCount.textContent = results.summary?.total_asins || 0;
    }
    
    if (imageCount) {
      imageCount.textContent = results.summary?.total_images || 0;
    }
    
    console.log('📈 Stats updated:', {
      products: results.summary?.total_asins,
      images: results.summary?.total_images
    });
  }
  
  // Show results section
  static showResultsSection() {
    const resultsSection = document.getElementById('extraction-results');
    if (resultsSection) {
      resultsSection.style.display = 'block';
    }
    
    // Hide progress section
    const progressSection = document.getElementById('extraction-progress');
    if (progressSection) {
      progressSection.style.display = 'none';
    }
  }
  
  // Populate results preview
  static populateResultsPreview(results) {
    // Create preview content
    const previewContent = this.generatePreviewContent(results);
    
    // Find preview container
    const previewContainer = document.getElementById('results-preview-content');
    if (previewContainer) {
      previewContainer.innerHTML = previewContent;
    } else {
      // Create preview container if not exists
      const resultsSection = document.getElementById('extraction-results');
      if (resultsSection) {
        const previewDiv = document.createElement('div');
        previewDiv.id = 'results-preview-content';
        previewDiv.className = 'results-preview-content';
        previewDiv.innerHTML = previewContent;
        previewDiv.style.display = 'none'; // Hidden by default
        resultsSection.appendChild(previewDiv);
      }
    }
  }
  
  // Generate preview HTML content
  static generatePreviewContent(results) {
    const products = results.analysis?.processed_products || [];
    const strategy = results.analysis?.product_strategy || {};
    const summary = results.summary || {};
    
    return `
      <div class="preview-container">
        <div class="preview-header">
          <h4>📊 Extraction Summary</h4>
          <div class="summary-stats">
            <span class="stat-item">🏷️ ${summary.total_asins} Products</span>
            <span class="stat-item">📷 ${summary.total_images} Images</span>
            <span class="stat-item">⭐ ${this.calculateAverageQuality(products)}% Avg Quality</span>
          </div>
        </div>
        
        <div class="preview-sections">
          ${this.generateProductsPreview(products)}
          ${this.generateStrategyPreview(strategy)}
          ${this.generateContentPreview(results.content)}
        </div>
      </div>
    `;
  }
  
  static generateProductsPreview(products) {
    if (!products.length) return '';
    
    const productCards = products.slice(0, 3).map(product => `
      <div class="product-card">
        <div class="product-header">
          <strong>${product.asin}</strong>
          <span class="quality-badge quality-${this.getQualityLevel(product.analysis.image_quality_score)}">
            ${product.analysis.image_quality_score}%
          </span>
        </div>
        <div class="product-stats">
          <span>📷 ${product.images.total_count} images</span>
          <span>🎨 ${product.images.variant_images.length} variants</span>
          <span>🌟 ${product.images.lifestyle_images.length} lifestyle</span>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="preview-section">
        <h5>🏷️ Product Analysis</h5>
        <div class="product-grid">
          ${productCards}
        </div>
      </div>
    `;
  }
  
  static generateStrategyPreview(strategy) {
    if (!strategy.insights) return '';
    
    const topProduct = strategy.insights.top_performing_product;
    const improvements = strategy.insights.improvement_opportunities?.slice(0, 3) || [];
    
    return `
      <div class="preview-section">
        <h5>📈 Strategy Insights</h5>
        <div class="strategy-content">
          ${topProduct ? `
            <div class="insight-item">
              <strong>🏆 Top Product:</strong> ${topProduct.asin}
              <span class="insight-detail">${topProduct.analysis.image_quality_score}% quality, ${topProduct.images.total_count} images</span>
            </div>
          ` : ''}
          
          ${improvements.length ? `
            <div class="insight-item">
              <strong>💡 Key Improvements:</strong>
              <ul class="improvement-list">
                ${improvements.map(imp => `<li>${imp}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  static generateContentPreview(content) {
    if (!content) return '';
    
    const packages = Object.keys(content).filter(key => key !== 'created_at');
    
    return `
      <div class="preview-section">
        <h5>📦 Content Packages</h5>
        <div class="content-packages">
          ${packages.map(pkg => `
            <div class="package-item">
              <span class="package-name">${this.formatPackageName(pkg)}</span>
              <span class="package-count">${this.getPackageItemCount(content[pkg])}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Setup action button handlers
  static setupResultsActions(results) {
    // Preview button
    const previewBtn = document.getElementById('preview-results');
    if (previewBtn) {
      previewBtn.onclick = () => this.togglePreview();
    }
    
    // Send enhanced button
    const sendBtn = document.getElementById('send-enhanced');
    if (sendBtn) {
      sendBtn.onclick = () => this.sendEnhancedResults(results);
    }
    
    // Save results button  
    const saveBtn = document.getElementById('save-results');
    if (saveBtn) {
      saveBtn.onclick = () => this.saveResults(results);
    }
    
    console.log('🔧 Results actions setup complete');
  }
  
  // Toggle preview visibility
  static togglePreview() {
    const previewContent = document.getElementById('results-preview-content');
    if (previewContent) {
      const isVisible = previewContent.style.display !== 'none';
      previewContent.style.display = isVisible ? 'none' : 'block';
      
      // Update button text
      const previewBtn = document.getElementById('preview-results');
      if (previewBtn) {
        previewBtn.textContent = isVisible ? '👁️ Preview' : '🔼 Hide Preview';
      }
    }
  }
  
  // Send enhanced results to webhook
  static async sendEnhancedResults(results) {
    console.log('📤 Sending enhanced results...');
    
    try {
      // Update button state
      const sendBtn = document.getElementById('send-enhanced');
      if (sendBtn) {
        const originalText = sendBtn.textContent;
        sendBtn.textContent = '⏳ Sending...';
        sendBtn.disabled = true;
        
        // Get keywords from storage
        const keywords = await this.getCurrentKeywords();
        
        // Load background tasks for webhook sending
        const { BackgroundTasks } = await import('./background-tasks.js');
        
        const response = await BackgroundTasks.sendToWebhook(results, keywords);
        
        // Show success
        sendBtn.textContent = '✅ Sent!';
        setTimeout(() => {
          sendBtn.textContent = originalText;
          sendBtn.disabled = false;
        }, 2000);
        
        console.log('✅ Enhanced results sent successfully');
        
        // Show success notification
        this.showNotification('Enhanced results sent successfully!', 'success');
        
      }
    } catch (error) {
      console.error('❌ Failed to send enhanced results:', error);
      
      // Reset button
      const sendBtn = document.getElementById('send-enhanced');
      if (sendBtn) {
        sendBtn.textContent = '❌ Failed';
        sendBtn.disabled = false;
        setTimeout(() => {
          sendBtn.textContent = '📤 Send Enhanced';
        }, 2000);
      }
      
      this.showNotification(`Failed to send: ${error.message}`, 'error');
    }
  }
  
  // Save results to file
  static async saveResults(results) {
    console.log('💾 Saving results...');
    
    try {
      // Prepare data for download
      const dataToSave = {
        ...results,
        exported_at: new Date().toISOString(),
        exported_by: 'AMZ Extractor ALL v1.0.0'
      };
      
      const jsonData = JSON.stringify(dataToSave, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `amz-extraction-${results.extraction_id || Date.now()}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Update button state
      const saveBtn = document.getElementById('save-results');
      if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✅ Saved!';
        setTimeout(() => {
          saveBtn.textContent = originalText;
        }, 2000);
      }
      
      console.log('✅ Results saved successfully');
      this.showNotification('Results saved to file!', 'success');
      
    } catch (error) {
      console.error('❌ Failed to save results:', error);
      this.showNotification(`Failed to save: ${error.message}`, 'error');
    }
  }
  
  // Show error message
  static showResultsError(error) {
    const resultsSection = document.getElementById('extraction-results');
    if (resultsSection) {
      resultsSection.innerHTML = `
        <div class="error-message">
          <h4>❌ Display Error</h4>
          <p>${error.message}</p>
          <button onclick="location.reload()" class="retry-btn">🔄 Retry</button>
        </div>
      `;
      resultsSection.style.display = 'block';
    }
  }
  
  // Get current keywords from storage
  static async getCurrentKeywords() {
    try {
      const data = await chrome.storage.local.get('amazon_keywords');
      return data.amazon_keywords || '';
    } catch (error) {
      console.error('Failed to get keywords:', error);
      return '';
    }
  }
  
  // Show notification to user
  static showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('extraction-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'extraction-notification';
      notification.className = 'extraction-notification';
      document.body.appendChild(notification);
    }
    
    // Set notification content and type
    notification.textContent = message;
    notification.className = `extraction-notification ${type}`;
    notification.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }
  
  // Helper functions
  static calculateAverageQuality(products) {
    if (!products.length) return 0;
    const total = products.reduce((sum, p) => sum + (p.analysis?.image_quality_score || 0), 0);
    return Math.round(total / products.length);
  }
  
  static getQualityLevel(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }
  
  static formatPackageName(packageName) {
    return packageName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  static getPackageItemCount(packageData) {
    if (Array.isArray(packageData)) return packageData.length;
    if (typeof packageData === 'object' && packageData !== null) {
      return Object.keys(packageData).length;
    }
    return 1;
  }
  
  // Clear results display
  static clearResults() {
    const resultsSection = document.getElementById('extraction-results');
    if (resultsSection) {
      resultsSection.style.display = 'none';
    }
    
    const previewContent = document.getElementById('results-preview-content');
    if (previewContent) {
      previewContent.innerHTML = '';
      previewContent.style.display = 'none';
    }
    
    console.log('🧹 Results display cleared');
  }
  
  // Get saved results from storage
  static async getSavedResults() {
    try {
      const data = await chrome.storage.local.get('extractorResults');
      return data.extractorResults || null;
    } catch (error) {
      console.error('Failed to get saved results:', error);
      return null;
    }
  }
  
  // Load and display saved results
  static async loadSavedResults() {
    console.log('📂 Loading saved results...');
    
    try {
      const results = await this.getSavedResults();
      if (results) {
        await this.displayResults(results);
        console.log('✅ Saved results loaded and displayed');
        return true;
      } else {
        console.log('ℹ️ No saved results found');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to load saved results:', error);
      return false;
    }
  }
  
  // Export results in different formats
  static async exportResults(results, format = 'json') {
    console.log(`📋 Exporting results as ${format}...`);
    
    try {
      let content, filename, mimeType;
      
      switch (format) {
        case 'csv':
          content = this.convertToCSV(results);
          filename = `amz-extraction-${results.extraction_id || Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'txt':
          content = this.convertToText(results);
          filename = `amz-extraction-${results.extraction_id || Date.now()}.txt`;
          mimeType = 'text/plain';
          break;
          
        default: // json
          content = JSON.stringify(results, null, 2);
          filename = `amz-extraction-${results.extraction_id || Date.now()}.json`;
          mimeType = 'application/json';
      }
      
      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Results exported as ${format}`);
      this.showNotification(`Results exported as ${format.toUpperCase()}!`, 'success');
      
    } catch (error) {
      console.error('❌ Export failed:', error);
      this.showNotification(`Export failed: ${error.message}`, 'error');
    }
  }
  
  // Convert results to CSV format
  static convertToCSV(results) {
    const products = results.analysis?.processed_products || [];
    
    const headers = [
      'ASIN',
      'Total Images',
      'Main Images',
      'Variant Images', 
      'Lifestyle Images',
      'Quality Score',
      'Variant Coverage',
      'Lifestyle Score'
    ];
    
    const rows = products.map(product => [
      product.asin,
      product.images.total_count,
      product.images.main_images.length,
      product.images.variant_images.length,
      product.images.lifestyle_images.length,
      product.analysis.image_quality_score,
      product.analysis.variant_coverage.coverage_score.toFixed(1),
      product.analysis.lifestyle_score
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  // Convert results to text format
  static convertToText(results) {
    const products = results.analysis?.processed_products || [];
    const summary = results.summary || {};
    
    let text = `AMZ Extractor ALL - Extraction Report\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `Extraction ID: ${results.extraction_id}\n\n`;
    
    text += `SUMMARY\n`;
    text += `=======\n`;
    text += `Total Products: ${summary.total_asins}\n`;
    text += `Total Images: ${summary.total_images}\n`;
    text += `Average Images per Product: ${summary.avg_images_per_product?.toFixed(1)}\n\n`;
    
    text += `PRODUCT DETAILS\n`;
    text += `===============\n`;
    
    products.forEach((product, index) => {
      text += `${index + 1}. ASIN: ${product.asin}\n`;
      text += `   Total Images: ${product.images.total_count}\n`;
      text += `   Quality Score: ${product.analysis.image_quality_score}%\n`;
      text += `   Main: ${product.images.main_images.length}, Variants: ${product.images.variant_images.length}, Lifestyle: ${product.images.lifestyle_images.length}\n\n`;
    });
    
    return text;
  }
}

// Export for different contexts
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // Extension context
  globalThis.ResultsManager = ResultsManager;
} else {
  // Module context  
  export default ResultsManager;
}