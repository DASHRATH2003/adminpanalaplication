import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from './config';

// Batch size for Firestore batch operations (max 500)
const BATCH_SIZE = 100;

class BulkUploadService {
  // Upload products in batches
  async uploadProducts(products, onProgress) {
    try {
      const totalProducts = products.length;
      let uploadedCount = 0;
      const results = {
        success: [],
        errors: []
      };

      // Split products into batches
      const batches = this.createBatches(products, BATCH_SIZE);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        try {
          // Process current batch
          const batchResults = await this.processBatch(batch);
          
          // Update results
          results.success.push(...batchResults.success);
          results.errors.push(...batchResults.errors);
          
          // Update progress
          uploadedCount += batch.length;
          const progress = Math.round((uploadedCount / totalProducts) * 100);
          
          if (onProgress) {
            onProgress(progress, uploadedCount, totalProducts);
          }
          
          // Small delay between batches to avoid overwhelming Firestore
          if (i < batches.length - 1) {
            await this.delay(100);
          }
          
        } catch (batchError) {
          console.error(`Batch ${i + 1} failed:`, batchError);
          
          // Add all products in failed batch to errors
          batch.forEach((product, index) => {
            results.errors.push({
              product,
              error: `Batch upload failed: ${batchError.message}`,
              index: uploadedCount + index
            });
          });
          
          uploadedCount += batch.length;
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Bulk upload failed:', error);
      throw new Error(`Bulk upload failed: ${error.message}`);
    }
  }

  // Process a single batch using Firestore batch operations
  async processBatch(products) {
    const batch = writeBatch(db);
    const results = {
      success: [],
      errors: []
    };

    try {
      // Add all products in the batch
      products.forEach((product, index) => {
        try {
          // Validate product data
          const validatedProduct = this.validateProduct(product);
          
          // Create new document reference
          const productRef = doc(collection(db, 'products'));
          
          // Add to batch
          batch.set(productRef, {
            ...validatedProduct,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          results.success.push({
            product: validatedProduct,
            id: productRef.id
          });
          
        } catch (validationError) {
          results.errors.push({
            product,
            error: validationError.message,
            index
          });
        }
      });

      // Commit the batch if there are successful products
      if (results.success.length > 0) {
        await batch.commit();
      }
      
      return results;
      
    } catch (error) {
      console.error('Batch processing failed:', error);
      throw error;
    }
  }

  // Validate individual product data
  validateProduct(product) {
    const errors = [];

    // Required fields validation
    if (!product.name?.trim()) errors.push('Product name is required');
    if (!product.description?.trim()) errors.push('Description is required');
    if (!product.category?.trim()) errors.push('Category is required');
    if (!product.subCategory?.trim()) errors.push('SubCategory is required');
    if (!product.brand?.trim()) errors.push('Brand is required');
    if (!product.sku?.trim()) errors.push('SKU is required');

    // Price validation
    const price = parseFloat(product.price);
    if (isNaN(price) || price <= 0) {
      errors.push('Valid price is required');
    }

    // Offer price validation
    const offerPrice = parseFloat(product.offerPrice);
    if (product.offerPrice && (isNaN(offerPrice) || offerPrice < 0)) {
      errors.push('Valid offer price is required');
    }

    // Stock validation
    const stock = parseInt(product.stock);
    if (isNaN(stock) || stock < 0) {
      errors.push('Valid stock quantity is required');
    }

    // Cash on delivery validation
    if (product.cashOnDelivery && !['yes', 'no'].includes(product.cashOnDelivery.toLowerCase())) {
      errors.push('Cash on Delivery must be Yes or No');
    }

    // Image URL validation (basic)
    if (product.image_url && !this.isValidUrl(product.image_url)) {
      errors.push('Valid image URL is required');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // Return cleaned product data
    return {
      name: product.name.trim(),
      description: product.description.trim(),
      category: product.category.trim(),
      subCategory: product.subCategory.trim(),
      brand: product.brand.trim(),
      sku: product.sku.trim(),
      price: price,
      offerPrice: parseFloat(product.offerPrice) || 0,
      stock: stock,
      cashOnDelivery: product.cashOnDelivery || 'Yes',
      image: product.image || '',
      attributes: product.attributes || '',
      date: product.date || new Date().toISOString().split('T')[0]
    };
  }

  // Create batches from products array
  createBatches(products, batchSize) {
    const batches = [];
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }
    return batches;
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Basic URL validation
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Get upload statistics
  getUploadStats(results) {
    return {
      total: results.success.length + results.errors.length,
      successful: results.success.length,
      failed: results.errors.length,
      successRate: results.success.length + results.errors.length > 0 
        ? Math.round((results.success.length / (results.success.length + results.errors.length)) * 100)
        : 0
    };
  }

  // Generate error report
  generateErrorReport(results) {
    if (results.errors.length === 0) {
      return null;
    }

    const errorReport = {
      totalErrors: results.errors.length,
      errors: results.errors.map(error => ({
        productName: error.product?.name || 'Unknown',
        error: error.error,
        rowIndex: error.index + 1
      }))
    };

    return errorReport;
  }
}

// Create and export singleton instance
const bulkUploadService = new BulkUploadService();
export default bulkUploadService;

// Export individual methods for direct use
export {
  bulkUploadService
};

// Export the main upload function
export const bulkUploadProducts = (products, onProgress) => {
  return bulkUploadService.uploadProducts(products, onProgress);
};