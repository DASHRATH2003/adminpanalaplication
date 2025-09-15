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
  serverTimestamp,
  onSnapshot,
  where,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

// Categories Services
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
        id: '',
        name: categoryData.name,
        image: imageUrl
      });

      // Update the document with its own ID
      await updateDoc(doc(db, 'category', docRef.id), {
        id: docRef.id
      });
      
      console.log('Category added with ID:', docRef.id);
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
      let updateData = {
        name: categoryData.name
      };
      
      // Upload new image if provided
      if (imageFile) {
        const imageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(snapshot.ref);
        updateData.image = imageUrl;
      } else if (categoryData.image) {
        updateData.image = categoryData.image;
      }
      
      await updateDoc(doc(db, 'category', categoryId), updateData);
      console.log('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }
};

export const userService = {
  // Get all users
  async getAll() {
    try {
      console.log('Fetching data from Users collection...');
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Document ID:', doc.id, 'Document data:', data);
        return {
          id: doc.id,
          ...data
        };
      });
      console.log('Users found:', users.length, users);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
};



// Messages and Conversations Services
export const messageService = {
  // Get all conversations
  async getConversations() {
    try {
      const q = query(
        collection(db, 'conversations'),
        orderBy('lastMessageTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get messages for a specific conversation
  async getMessages(conversationId) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send a new message
  async sendMessage(messageData) {
    try {
      const message = {
        ...messageData,
        timestamp: serverTimestamp(),
        status: 'sent'
      };
      
      const docRef = await addDoc(collection(db, 'messages'), message);
      
      // Update conversation with last message
      await this.updateConversation(messageData.conversationId, {
        lastMessage: messageData.message,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: messageData.senderId
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Create or update conversation
  async createConversation(conversationData) {
    try {
      const conversation = {
        ...conversationData,
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'conversations'), conversation);
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  // Update conversation
  async updateConversation(conversationId, updateData) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, updateData);
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  },

  // Listen to real-time messages
  subscribeToMessages(conversationId, callback) {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  },

  // Listen to real-time conversations
  subscribeToConversations(callback) {
    const q = query(
      collection(db, 'conversations'),
      orderBy('lastMessageTime', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const conversations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(conversations);
    });
  },

  // Mark message as read
  async markAsRead(messageId) {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        status: 'read',
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  // Clear all conversations and messages
  async clearAllData() {
    try {
      // Delete all messages
      const messagesSnapshot = await getDocs(collection(db, 'messages'));
      const messageDeletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(messageDeletePromises);
      
      // Delete all conversations
      const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
      const conversationDeletePromises = conversationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(conversationDeletePromises);
      
      console.log('All conversations and messages cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
};

// Sub Under Categories Services
export const subUnderCategoryService = {
  // Get all sub under categories
  async getAll() {
    try {
      console.log('Fetching data from SubUnderCategories collection...');
      const querySnapshot = await getDocs(collection(db, 'subundercategory'));
      const subUnderCategories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      console.log('Sub Under Categories found:', subUnderCategories.length, subUnderCategories);
      return subUnderCategories;
    } catch (error) {
      console.error('Error fetching sub under categories:', error);
      throw error;
    }
  },

  // Add new sub under category
  async add(subUnderCategoryData) {
    try {
      const docRef = await addDoc(collection(db, 'subundercategory'), {
        id: '',
        name: subUnderCategoryData.name,
        subCategoryId: subUnderCategoryData.subCategoryId,
        date: subUnderCategoryData.date
      });

      // Update the document with its own ID
      await updateDoc(doc(db, 'subundercategory', docRef.id), {
        id: docRef.id
      });

      return {
        id: docRef.id,
        name: subUnderCategoryData.name,
        subCategoryId: subUnderCategoryData.subCategoryId,
        date: subUnderCategoryData.date
      };
    } catch (error) {
      console.error('Error adding sub under category:', error);
      throw error;
    }
  },

  // Delete sub under category
  async delete(subUnderCategoryId) {
    try {
      console.log('Delete sub under category method called with ID:', subUnderCategoryId);
      await deleteDoc(doc(db, 'subundercategory', subUnderCategoryId));
      console.log('Sub Under Category deleted successfully');
    } catch (error) {
      console.error('Error deleting sub under category:', error);
      throw error;
    }
  },

  // Update sub under category
  async update(subUnderCategoryId, subUnderCategoryData) {
    try {
      console.log('Update sub under category method called with ID:', subUnderCategoryId);
      console.log('Sub Under Category data:', subUnderCategoryData);
      
      const subUnderCategoryRef = doc(db, 'subundercategory', subUnderCategoryId);
      
      await updateDoc(subUnderCategoryRef, {
        name: subUnderCategoryData.name,
        subCategoryId: subUnderCategoryData.subCategoryId,
        date: subUnderCategoryData.date
      });
      
      console.log('Sub Under Category updated successfully');
      
      // Return updated data
      const updatedDoc = await getDoc(subUnderCategoryRef);
      return {
        id: updatedDoc.id,
        data: updatedDoc.data()
      };
    } catch (error) {
      console.error('Error updating sub under category:', error);
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
        attributes: productData.attributes || {},
        stock: parseInt(productData.stock) || 0,
        sku: productData.sku || '',
        cashOnDelivery: productData.cashOnDelivery || 'no',
        date: productData.date || new Date().toISOString().split('T')[0],
        images: imageUrls,
        image: imageUrls[0] || null // Keep backward compatibility
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
        attributes: productData.attributes || {},
        stock: parseInt(productData.stock) || 0,
        sku: productData.sku || '',
        cashOnDelivery: productData.cashOnDelivery || 'no',
        date: productData.date || new Date().toISOString().split('T')[0],
        images: imageUrls,
        image: imageUrls[0] || null
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
        ...updateData
      });
      
      // Return updated product data
      return {
        id: productId,
        ...updateData
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
        id: '',
        name: subCategoryData.name,
        category: subCategoryData.category
      });

      // Update the document with its own ID
      await updateDoc(doc(db, 'subcategory', docRef.id), {
        id: docRef.id
      });

      return {
        id: docRef.id,
        name: subCategoryData.name,
        category: subCategoryData.category
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
        ...subCategoryData
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
      const q = query(collection(db, 'brands'));
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
        subCategory: brandData.subCategory
      });

      return {
        id: docRef.id,
        name: brandData.name,
        subCategory: brandData.subCategory
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
        ...brandData
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
      const q = query(collection(db, 'posters'));
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

      // Generate automatic banner ID
      const generateBannerId = () => {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `BNR_${timestamp}_${randomStr}`.toUpperCase();
      };

      const autoBannerId = generateBannerId();

      const docRef = await addDoc(collection(db, 'posters'), {
        title: posterData.title || posterData.bannerName || '',
        description: posterData.description || '',
        status: posterData.status || 'active',
        image: imageUrl,
        bannerId: autoBannerId,
        bannerName: posterData.bannerName || null,
        productId: posterData.productId || null,
        price: posterData.price || null
      });

      return {
        id: docRef.id,
        title: posterData.title || posterData.bannerName || '',
        description: posterData.description || '',
        status: posterData.status || 'active',
        image: imageUrl,
        bannerId: autoBannerId,
        bannerName: posterData.bannerName || null,
        productId: posterData.productId || null,
        price: posterData.price || null
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
        ...updateData
      });
      
      // Return updated poster data
      return {
        id: posterId,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating poster:', error);
      throw error;
    }
  }
};