import { db } from './config';
import { collection, getDocs } from 'firebase/firestore';

// Test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    console.log('Starting Firebase connection test...');
    
    // Test products collection
    const productsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(productsRef);
    console.log('Documents in Products collection:', productsSnapshot.size);
    
    // Test category collection
    const categoryRef = collection(db, 'category');
    const categorySnapshot = await getDocs(categoryRef);
    console.log('Documents in Category collection:', categorySnapshot.size);
    
    // Test subcategory collection
    const subcategoryRef = collection(db, 'subcategory');
    const subcategorySnapshot = await getDocs(subcategoryRef);
    console.log('Documents in Subcategory collection:', subcategorySnapshot.size);
    
    // Print actual data
    if (productsSnapshot.size > 0) {
      console.log('Products data:');
      productsSnapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
      });
    }
    
    if (categorySnapshot.size > 0) {
      console.log('Category data:');
      categorySnapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
      });
    }
    
    if (subcategorySnapshot.size > 0) {
      console.log('Subcategory data:');
      subcategorySnapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
      });
    }
    
    return {
      products: productsSnapshot.size,
      categories: categorySnapshot.size,
      subcategories: subcategorySnapshot.size
    };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    throw error;
  }
};