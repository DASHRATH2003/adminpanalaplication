import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
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
      const categories = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Document ID:', doc.id, 'Document data:', data);
        return {
          id: doc.id,
          ...data
        };
      });
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
        createdAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        name: categoryData.name,
        image: imageUrl
      };
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  },

  // Delete category
  async delete(categoryId) {
    try {
      console.log('Delete method called with categoryId:', categoryId);
      console.log('Attempting direct deletion...');
      
      await deleteDoc(doc(db, 'category', categoryId));
      console.log('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Update category
  async update(categoryId, categoryData, imageFile) {
    try {
      console.log('Update method called with categoryId:', categoryId);
      console.log('Category data:', categoryData);
      
      // Get all categories to find the right one
      const querySnapshot = await getDocs(collection(db, 'category'));
      let targetDoc = null;
      let targetDocId = null;
      
      // Search through all documents
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('Checking document:', doc.id, 'with data:', data);
        
        // First try to match by exact ID
        if (doc.id === categoryId) {
          targetDoc = doc;
          targetDocId = doc.id;
          console.log('Found exact ID match:', doc.id);
        }
        // If no exact ID match, try to match by name and existing data
        else if (!targetDoc && data.name && categoryData.name && 
                 data.name.toLowerCase().trim() === categoryData.name.toLowerCase().trim()) {
          targetDoc = doc;
          targetDocId = doc.id;
          console.log('Found name match:', doc.id, 'for name:', data.name);
        }
      });
      
      if (!targetDoc) {
        console.error('Category document not found for ID:', categoryId);
        throw new Error('Category not found');
      }
      
      const currentCategory = targetDoc.data();
      console.log('Current category data:', currentCategory);
      let imageUrl = currentCategory.image;
      
      // Upload new image if provided
      if (imageFile) {
        const imageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      
      const updatedData = {
        ...categoryData,
        image: imageUrl,
        updatedAt: serverTimestamp()
      };
      
      console.log('Updating document with ID:', targetDocId, 'with data:', updatedData);
      const categoryRef = doc(db, 'category', targetDocId);
      await updateDoc(categoryRef, updatedData);
      
      return {
        id: targetDocId,
        ...currentCategory,
        ...updatedData
      };
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
  async add(productData, imageFiles) {
    try {
      let imageUrls = [];
      
      // Upload multiple images if provided
      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const imageFile = imageFiles[i];
          const imageRef = ref(storage, `products/${Date.now()}_${i}_${imageFile.name}`);
          const snapshot = await uploadBytes(imageRef, imageFile);
          const imageUrl = await getDownloadURL(snapshot.ref);
          imageUrls.push(imageUrl);
        }
      }

      const docRef = await addDoc(collection(db, 'products'), {
        name: productData.name,
        description: productData.description || '',
        category: productData.category,
        subCategory: productData.subCategory,
        price: parseFloat(productData.price) || 0,
        offerPrice: parseFloat(productData.offerPrice) || 0,
        brand: productData.brand || '',
        attribute: productData.attribute || '',
        stock: parseInt(productData.stock) || 0,
        sku: productData.sku || '',
        cashOnDelivery: productData.cashOnDelivery || 'no',
        date: productData.date || new Date().toISOString().split('T')[0],
        images: imageUrls,
        image: imageUrls[0] || null, // Keep backward compatibility
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        name: productData.name,
        description: productData.description || '',
        category: productData.category,
        subCategory: productData.subCategory,
        price: parseFloat(productData.price) || 0,
        offerPrice: parseFloat(productData.offerPrice) || 0,
        brand: productData.brand || '',
        attribute: productData.attribute || '',
        stock: parseInt(productData.stock) || 0,
        sku: productData.sku || '',
        cashOnDelivery: productData.cashOnDelivery || 'no',
        date: productData.date || new Date().toISOString().split('T')[0],
        images: imageUrls,
        image: imageUrls[0] || null,
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
  async update(productId, productData, imageFiles) {
    try {
      let updateData = { ...productData };
      
      // Upload new images if provided
      if (imageFiles && imageFiles.length > 0) {
        let imageUrls = [];
        for (let i = 0; i < imageFiles.length; i++) {
          const imageFile = imageFiles[i];
          const imageRef = ref(storage, `products/${Date.now()}_${i}_${imageFile.name}`);
          const snapshot = await uploadBytes(imageRef, imageFile);
          const imageUrl = await getDownloadURL(snapshot.ref);
          imageUrls.push(imageUrl);
        }
        updateData.images = imageUrls;
        updateData.image = imageUrls[0] || null; // Keep backward compatibility
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
      console.log('Delete subcategory method called with ID:', subCategoryId);
      await deleteDoc(doc(db, 'subcategory', subCategoryId));
      console.log('Subcategory deleted successfully');
    } catch (error) {
      console.error('Error deleting sub category:', error);
      throw error;
    }
  },

  // Update sub category
  async update(subCategoryId, subCategoryData) {
    try {
      console.log('SubCategory update called with ID:', subCategoryId);
      
      // Get all subcategories to find the right one
      const querySnapshot = await getDocs(collection(db, 'subcategory'));
      let targetDoc = null;
      let targetDocId = null;
      
      // Search through all documents
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('Checking subcategory document:', doc.id, 'with data:', data);
        
        // First try to match by exact ID
        if (doc.id === subCategoryId) {
          targetDoc = doc;
          targetDocId = doc.id;
          console.log('Found exact subcategory ID match:', doc.id);
        }
        // If no exact ID match, try to match by name
        else if (!targetDoc && data.name && subCategoryData.name && 
                 data.name.toLowerCase().trim() === subCategoryData.name.toLowerCase().trim()) {
          targetDoc = doc;
          targetDocId = doc.id;
          console.log('Found subcategory name match:', doc.id, 'for name:', data.name);
        }
      });
      
      if (!targetDoc) {
        console.error('SubCategory document not found for ID:', subCategoryId);
        throw new Error('SubCategory not found');
      }
      
      console.log('Updating subcategory document with ID:', targetDocId);
      await updateDoc(doc(db, 'subcategory', targetDocId), {
        ...subCategoryData,
        updatedAt: serverTimestamp()
      });
      
      // Return updated subcategory data
      return {
        id: targetDocId,
        ...subCategoryData
      };
    } catch (error) {
      console.error('Error updating sub category:', error);
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
      console.log('Delete brand method called with ID:', brandId);
      await deleteDoc(doc(db, 'brands', brandId));
      console.log('Brand deleted successfully');
    } catch (error) {
      console.error('Error deleting brand:', error);
      throw error;
    }
  },

  // Update brand
  async update(brandId, brandData) {
    try {
      await updateDoc(doc(db, 'brands', brandId), {
        ...brandData,
        updatedAt: serverTimestamp()
      });
      
      // Return updated brand data
      return {
        id: brandId,
        ...brandData
      };
    } catch (error) {
      console.error('Error updating brand:', error);
      throw error;
    }
  }
};

// Posters Services
export const posterService = {
  // Get all posters
  async getAll() {
    try {
      console.log('Fetching data from Posters collection...');
      const q = query(collection(db, 'posters'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const posters = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Posters found:', posters.length, posters);
      return posters;
    } catch (error) {
      console.error('Error fetching posters:', error);
      throw error;
    }
  },

  // Add new poster
  async add(posterData, imageFile) {
    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (imageFile) {
        const imageRef = ref(storage, `posters/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const docRef = await addDoc(collection(db, 'posters'), {
        title: posterData.title,
        description: posterData.description || '',
        status: posterData.status || 'active',
        image: imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        title: posterData.title,
        description: posterData.description || '',
        status: posterData.status || 'active',
        image: imageUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding poster:', error);
      throw error;
    }
  },

  // Delete poster
  async delete(posterId) {
    try {
      console.log('Delete poster method called with ID:', posterId);
      await deleteDoc(doc(db, 'posters', posterId));
      console.log('Poster deleted successfully');
    } catch (error) {
      console.error('Error deleting poster:', error);
      throw error;
    }
  },

  // Update poster
  async update(posterId, posterData, imageFile) {
    try {
      let updateData = { ...posterData };
      
      // Upload new image if provided
      if (imageFile) {
        const imageRef = ref(storage, `posters/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(snapshot.ref);
        updateData.image = imageUrl;
      }
      
      await updateDoc(doc(db, 'posters', posterId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      // Return updated poster data
      return {
        id: posterId,
        ...updateData,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error updating poster:', error);
      throw error;
    }
  }
};