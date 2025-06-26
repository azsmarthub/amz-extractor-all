// plugins/extractor/data-processor.js
// Data processing logic adapted from n8n processing JS

export class DataProcessor {
  
  // Main processing function - adapted from n8n filter logic
  static async processExtractedData(extractionResults) {
    console.log('🔄 Starting data processing...');
    
    try {
      const { images, asins } = extractionResults;
      
      // Process product data
      const processedProducts = await this.processProducts(asins, images);
      
      // Generate product strategy
      const productStrategy = await this.generateProductStrategy(processedProducts);
      
      // Create content packages
      const contentPackages = await this.createContentPackages(processedProducts, productStrategy);
      
      return {
        processed_products: processedProducts,
        product_strategy: productStrategy,
        content_ready_packages: contentPackages,
        processing_stats: {
          total_products: asins.length,
          total_images: images.length,
          processed_at: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Data processing error:', error);
      throw new Error(`Data processing failed: ${error.message}`);
    }
  }
  
  // Process individual products - from n8n product analysis
  static async processProducts(asins, imageData) {
    const products = [];
    
    for (const asin of asins) {
      try {
        // Get product images for this ASIN
        const productImages = imageData.filter(img => img.asin === asin);
        
        // Process product data (simplified from n8n logic)
        const productData = {
          asin: asin,
          images: {
            main_images: productImages.filter(img => img.type === 'main'),
            variant_images: productImages.filter(img => img.type === 'variant'),
            lifestyle_images: productImages.filter(img => img.type === 'lifestyle'),
            total_count: productImages.length
          },
          analysis: {
            image_quality_score: this.calculateImageQuality(productImages),
            variant_coverage: this.analyzeVariantCoverage(productImages),
            lifestyle_score: this.analyzeLifestyleContent(productImages)
          },
          extracted_at: new Date().toISOString()
        };
        
        products.push(productData);
        
      } catch (error) {
        console.error(`Error processing product ${asin}:`, error);
        // Continue with other products
      }
    }
    
    return products;
  }
  
  // Generate strategy analysis - from n8n strategy logic
  static async generateProductStrategy(products) {
    const strategy = {
      overview: {
        total_products: products.length,
        avg_images_per_product: this.calculateAverageImages(products),
        quality_distribution: this.analyzeQualityDistribution(products)
      },
      insights: {
        top_performing_product: this.findTopProduct(products),
        improvement_opportunities: this.findImprovements(products),
        content_gaps: this.identifyContentGaps(products)
      },
      recommendations: {
        image_optimization: this.generateImageRecommendations(products),
        content_creation: this.generateContentRecommendations(products),
        variant_expansion: this.generateVariantRecommendations(products)
      },
      generated_at: new Date().toISOString()
    };
    
    return strategy;
  }
  
  // Create content packages - from n8n content packaging
  static async createContentPackages(products, strategy) {
    const packages = {
      blog_content: {
        product_comparisons: this.generateComparisonContent(products),
        buying_guides: this.generateBuyingGuides(products, strategy),
        feature_highlights: this.generateFeatureContent(products)
      },
      social_media: {
        instagram_posts: this.generateInstagramContent(products),
        facebook_ads: this.generateFacebookContent(products),
        pinterest_pins: this.generatePinterestContent(products)
      },
      product_listings: {
        optimized_titles: this.generateOptimizedTitles(products),
        bullet_points: this.generateBulletPoints(products),
        descriptions: this.generateDescriptions(products)
      },
      marketing_assets: {
        email_campaigns: this.generateEmailContent(products),
        landing_pages: this.generateLandingPageContent(products),
        ad_creatives: this.generateAdCreatives(products)
      },
      created_at: new Date().toISOString()
    };
    
    return packages;
  }
  
  // Helper functions - simplified from n8n analysis
  static calculateImageQuality(images) {
    if (!images.length) return 0;
    
    const qualityFactors = images.map(img => {
      let score = 50; // Base score
      
      // Resolution factor
      if (img.width && img.height) {
        const pixels = img.width * img.height;
        if (pixels > 1000000) score += 20; // High res
        else if (pixels > 500000) score += 10; // Medium res
      }
      
      // File size factor (not too small, not too large)
      if (img.file_size) {
        if (img.file_size > 100000 && img.file_size < 5000000) score += 15;
      }
      
      // Type bonus
      if (img.type === 'main') score += 15;
      
      return Math.min(score, 100);
    });
    
    return Math.round(qualityFactors.reduce((a, b) => a + b, 0) / qualityFactors.length);
  }
  
  static analyzeVariantCoverage(images) {
    const variantImages = images.filter(img => img.type === 'variant');
    const mainImages = images.filter(img => img.type === 'main');
    
    return {
      variant_count: variantImages.length,
      main_count: mainImages.length,
      coverage_score: Math.min((variantImages.length / Math.max(mainImages.length, 1)) * 100, 100)
    };
  }
  
  static analyzeLifestyleContent(images) {
    const lifestyleImages = images.filter(img => img.type === 'lifestyle');
    const totalImages = images.length;
    
    return {
      lifestyle_count: lifestyleImages.length,
      lifestyle_ratio: totalImages > 0 ? (lifestyleImages.length / totalImages) * 100 : 0,
      lifestyle_score: Math.min(lifestyleImages.length * 20, 100)
    };
  }
  
  static calculateAverageImages(products) {
    if (!products.length) return 0;
    const totalImages = products.reduce((sum, p) => sum + p.images.total_count, 0);
    return Math.round(totalImages / products.length * 10) / 10;
  }
  
  static analyzeQualityDistribution(products) {
    const scores = products.map(p => p.analysis.image_quality_score);
    const high = scores.filter(s => s >= 80).length;
    const medium = scores.filter(s => s >= 60 && s < 80).length;
    const low = scores.filter(s => s < 60).length;
    
    return { high, medium, low };
  }
  
  static findTopProduct(products) {
    if (!products.length) return null;
    
    return products.reduce((best, current) => {
      const bestScore = best.analysis.image_quality_score + best.images.total_count;
      const currentScore = current.analysis.image_quality_score + current.images.total_count;
      return currentScore > bestScore ? current : best;
    });
  }
  
  static findImprovements(products) {
    const improvements = [];
    
    products.forEach(product => {
      if (product.analysis.image_quality_score < 70) {
        improvements.push(`${product.asin}: Low image quality (${product.analysis.image_quality_score}%)`);
      }
      if (product.images.total_count < 5) {
        improvements.push(`${product.asin}: Insufficient images (${product.images.total_count})`);
      }
      if (product.analysis.lifestyle_score < 40) {
        improvements.push(`${product.asin}: Needs more lifestyle content`);
      }
    });
    
    return improvements;
  }
  
  static identifyContentGaps(products) {
    const gaps = [];
    
    const totalLifestyle = products.reduce((sum, p) => sum + p.images.lifestyle_images.length, 0);
    if (totalLifestyle < products.length * 2) {
      gaps.push('Insufficient lifestyle imagery across product line');
    }
    
    const lowQualityProducts = products.filter(p => p.analysis.image_quality_score < 60);
    if (lowQualityProducts.length > 0) {
      gaps.push(`${lowQualityProducts.length} products need image quality improvement`);
    }
    
    return gaps;
  }
  
  // Content generation helpers - simplified templates
  static generateComparisonContent(products) {
    return products.map(product => ({
      asin: product.asin,
      comparison_points: [
        `Image quality: ${product.analysis.image_quality_score}%`,
        `Total images: ${product.images.total_count}`,
        `Lifestyle content: ${product.analysis.lifestyle_score}%`
      ]
    }));
  }
  
  static generateBuyingGuides(products, strategy) {
    return {
      title: "Complete Buying Guide - Top Product Analysis",
      sections: [
        {
          title: "Product Overview",
          content: `Analyzed ${products.length} products with ${strategy.overview.avg_images_per_product} average images per product`
        },
        {
          title: "Quality Analysis", 
          content: `Quality distribution: ${strategy.overview.quality_distribution.high} high, ${strategy.overview.quality_distribution.medium} medium, ${strategy.overview.quality_distribution.low} low`
        }
      ]
    };
  }
  
  static generateFeatureContent(products) {
    return products.map(product => ({
      asin: product.asin,
      features: [
        `${product.images.main_images.length} main product images`,
        `${product.images.variant_images.length} variant options`,
        `${product.images.lifestyle_images.length} lifestyle shots`,
        `${product.analysis.image_quality_score}% image quality score`
      ]
    }));
  }
  
  static generateInstagramContent(products) {
    return products.map(product => ({
      asin: product.asin,
      post_ideas: [
        `Showcase main product with ${product.images.main_images.length} angle variations`,
        `Lifestyle content featuring ${product.images.lifestyle_images.length} real-world scenarios`,
        `Quality comparison highlighting ${product.analysis.image_quality_score}% excellence`
      ]
    }));
  }
  
  static generateFacebookContent(products) {
    return products.slice(0, 3).map(product => ({
      asin: product.asin,
      ad_copy: `Discover this amazing product with ${product.images.total_count} detailed images. Quality score: ${product.analysis.image_quality_score}%`,
      targeting_suggestions: product.images.lifestyle_images.length > 0 ? 'Lifestyle-focused audience' : 'Product-focused audience'
    }));
  }
  
  static generatePinterestContent(products) {
    return products.map(product => ({
      asin: product.asin,
      pin_ideas: [
        `Product showcase - ${product.images.main_images.length} views`,
        `Lifestyle inspiration - ${product.images.lifestyle_images.length} scenarios`
      ]
    }));
  }
  
  static generateOptimizedTitles(products) {
    return products.map(product => ({
      asin: product.asin,
      title: `Premium Product - ${product.images.total_count} Images - ${product.analysis.image_quality_score}% Quality`,
      variations: [
        `High-Quality Product with ${product.images.total_count} Detailed Views`,
        `Professional Product - ${product.analysis.image_quality_score}% Quality Guaranteed`
      ]
    }));
  }
  
  static generateBulletPoints(products) {
    return products.map(product => ({
      asin: product.asin,
      bullets: [
        `📸 ${product.images.total_count} high-quality product images`,
        `⭐ ${product.analysis.image_quality_score}% image quality score`,
        `🎯 ${product.images.variant_images.length} variant options available`,
        `🌟 ${product.images.lifestyle_images.length} lifestyle scenarios shown`
      ]
    }));
  }
  
  static generateDescriptions(products) {
    return products.map(product => ({
      asin: product.asin,
      description: `Experience this exceptional product through ${product.images.total_count} carefully curated images, achieving ${product.analysis.image_quality_score}% quality excellence. With ${product.images.variant_images.length} variants and ${product.images.lifestyle_images.length} lifestyle demonstrations, you'll have complete confidence in your choice.`
    }));
  }
  
  static generateEmailContent(products) {
    const topProduct = this.findTopProduct(products);
    return {
      subject: `New Product Analysis: ${products.length} Products Reviewed`,
      content: `Our latest analysis reveals ${topProduct?.asin} as the top performer with ${topProduct?.analysis.image_quality_score}% quality score.`,
      product_highlights: products.slice(0, 3)
    };
  }
  
  static generateLandingPageContent(products) {
    return {
      hero_section: `${products.length} Premium Products Analyzed`,
      product_grid: products.map(p => ({
        asin: p.asin,
        image_count: p.images.total_count,
        quality_badge: p.analysis.image_quality_score >= 80 ? 'Premium Quality' : 'Good Quality'
      })),
      trust_indicators: `${products.reduce((sum, p) => sum + p.images.total_count, 0)} total images analyzed`
    };
  }
  
  static generateAdCreatives(products) {
    return products.slice(0, 2).map(product => ({
      asin: product.asin,
      creative_concepts: [
        `High-quality showcase: ${product.analysis.image_quality_score}% excellence`,
        `Complete view: ${product.images.total_count} detailed angles`,
        `Lifestyle integration: ${product.images.lifestyle_images.length} real scenarios`
      ]
    }));
  }
  
  // Recommendation generators
  static generateImageRecommendations(products) {
    const recommendations = [];
    
    products.forEach(product => {
      if (product.analysis.image_quality_score < 70) {
        recommendations.push(`${product.asin}: Improve image quality - current score ${product.analysis.image_quality_score}%`);
      }
      if (product.images.total_count < 7) {
        recommendations.push(`${product.asin}: Add more images - current count ${product.images.total_count}`);
      }
    });
    
    return recommendations;
  }
  
  static generateContentRecommendations(products) {
    const recommendations = [];
    
    const lowLifestyleProducts = products.filter(p => p.analysis.lifestyle_score < 40);
    if (lowLifestyleProducts.length > 0) {
      recommendations.push(`Add lifestyle imagery for ${lowLifestyleProducts.length} products`);
    }
    
    return recommendations;
  }
  
  static generateVariantRecommendations(products) {
    const recommendations = [];
    
    products.forEach(product => {
      if (product.images.variant_images.length < 3) {
        recommendations.push(`${product.asin}: Expand variant coverage - current ${product.images.variant_images.length} variants`);
      }
    });
    
    return recommendations;
  }
}

// Export for background script usage
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // Running in extension context
  globalThis.DataProcessor = DataProcessor;
} else {
  // Running in module context
  export default DataProcessor;