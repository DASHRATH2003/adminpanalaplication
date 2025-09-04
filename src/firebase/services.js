import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

// Categories Services
export const categoryService = {
  // Get all categories
  async getAll() {
    try {
      console.log('Fetching data from Categories collection...');
      const querySnapshot = await getDocs(collection(db, 'category'));
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Categories found:', categories.length, categories);
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Add new category
  async add(categoryData, imageFile) {
    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (imageFile) {
        const imageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const docRef = await addDoc(collection(db, 'category'), {
        name: categoryData.name,
        image: imageUrl,
        date: categoryData.date,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        name: categoryData.name,
        image: imageUrl,
        date: categoryData.date,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  },

  // Delete category
  async delete(categoryId) {
    try {
      await deleteDoc(doc(db, 'category', categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Update category
  async update(categoryId, categoryData) {
    try {
      await updateDoc(doc(db, 'category', categoryId), {
        ...categoryData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }
};

// Products Services
export const productService = {
  // Get all products
  async getAll() {
    try {
      console.log('Fetching data from Products collection...');
      // First try without orderBy
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Products found:', products.length, products);
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Add new product
  async add(productData, imageFile) {
    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (imageFile) {
        const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const docRef = await addDoc(collection(db, 'products'), {
        name: productData.name,
        category: productData.category,
        subCategory: productData.subCategory,
        price: parseFloat(productData.price),
        image: imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        name: productData.name,
        category: productData.category,
        subCategory: productData.subCategory,
        price: parseFloat(productData.price),
        image: imageUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  // Delete product
  async delete(productId) {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Update product
  async update(productId, productData, imageFile) {
    try {
      let updateData = { ...productData };
      
      // Upload new image if provided
      if (imageFile) {
        const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(snapshot.ref);
        updateData.image = imageUrl;
      }
      
      await updateDoc(doc(db, 'products', productId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      // Return updated product data
      return {
        id: productId,
        ...updateData,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }
};

// Sub Categories Services
export const subCategoryService = {
  // Get all sub categories
  async getAll() {
    try {
      console.log('Fetching data from Subcategories collection...');
      const querySnapshot = await getDocs(collection(db, 'subcategory'));
      const subcategories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Subcategories found:', subcategories.length, subcategories);
      return subcategories;
    } catch (error) {
      console.error('Error fetching sub categories:', error);
      throw error;
    }
  },

  // Add new sub category
  async add(subCategoryData) {
    try {
      const docRef = await addDoc(collection(db, 'subcategory'), {
        name: subCategoryData.name,
        category: subCategoryData.category,
        date: subCategoryData.date,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        name: subCategoryData.name,
        category: subCategoryData.category,
        date: subCategoryData.date,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding sub category:', error);
      throw error;
    }
  },

  // Delete sub category
  async delete(subCategoryId) {
    try {
      await deleteDoc(doc(db, 'subcategory', subCategoryId));
    } catch (error) {
      console.error('Error deleting sub category:', error);
      throw error;
    }
  }
};

// Brands Services
export const brandService = {
  // Get all brands
  async getAll() {
    try {
      const q = query(collection(db, 'brands'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  },

  // Add new brand
  async add(brandData) {
    try {
      const docRef = await addDoc(collection(db, 'brands'), {
        name: brandData.name,
        subCategory: brandData.subCategory,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        name: brandData.name,
        subCategory: brandData.subCategory,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding brand:', error);
      throw error;
    }
  },

  // Delete brand
  async delete(brandId) {
    try {
      await deleteDoc(doc(db, 'brands', brandId));
    } catch (error) {
      console.error('Error deleting brand:', error);
      throw error;
    }
  }
};