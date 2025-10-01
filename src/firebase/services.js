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
  onSnapshot,
  serverTimestamp,
  where,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

// Admin Services
export const adminService = {
  // Add new admin
  async add(adminData) {
    try {
      console.log('Adding admin to Firebase:', adminData);
      const docRef = await addDoc(collection(db, 'admin'), adminData);
      console.log('Admin added with ID:', docRef.id);
      return { id: docRef.id, ...adminData };
    } catch (error) {
      console.error('Error adding admin:', error);
      throw error;
    }
  },

  // Get all admins
  async getAll() {
    try {
      console.log('Fetching admins from Firebase...');
      const querySnapshot = await getDocs(collection(db, 'admin'));
      const admins = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Admins found:', admins.length);
      return admins;
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  },

  // Get admin by email
  async getByEmail(email) {
    try {
      const q = query(collection(db, 'admin'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching admin by email:', error);
      throw error;
    }
  },

  // Update admin
  async update(id, adminData) {
    try {
      const adminRef = doc(db, 'admin', id);
      await updateDoc(adminRef, adminData);
      console.log('Admin updated successfully');
      return { id, ...adminData };
    } catch (error) {
      console.error('Error updating admin:', error);
      throw error;
    }
  },

  // Delete admin
  async delete(id) {
    try {
      await deleteDoc(doc(db, 'admin', id));
      console.log('Admin deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting admin:', error);
      throw error;
    }
  },

  // Update FCM token for admin
  async updateFCMToken(adminId, fcmToken) {
    try {
      const adminRef = doc(db, 'admin', adminId);
      await updateDoc(adminRef, {
        fcmToken: fcmToken,
        fcmTokenUpdatedAt: new Date().toISOString()
      });
      console.log('FCM token updated successfully for admin:', adminId);
      return true;
    } catch (error) {
      console.error('Error updating FCM token:', error);
      throw error;
    }
  },

  // Get admin by FCM token
  async getByFCMToken(fcmToken) {
    try {
      const q = query(collection(db, 'admin'), where('fcmToken', '==', fcmToken));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching admin by FCM token:', error);
      throw error;
    }
  },

  // Remove FCM token from admin (for logout)
  async removeFCMToken(adminId) {
    try {
      const adminRef = doc(db, 'admin', adminId);
      await updateDoc(adminRef, {
        fcmToken: null,
        fcmTokenUpdatedAt: new Date().toISOString()
      });
      console.log('FCM token removed successfully for admin:', adminId);
      return true;
    } catch (error) {
      console.error('Error removing FCM token:', error);
      throw error;
    }
  }
};

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

// Orders Services
export const orderService = {
  // Get all orders from customer-based structure (users -> customerId -> order -> orderId)
  async getAll() {
    try {
      console.log('Fetching orders from customer-based structure...');
      const orders = [];
      
      // First, get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log(`Found ${usersSnapshot.size} users`);
      
      // For each user, get their orders
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        try {
          // Get orders for this user
          const ordersSnapshot = await getDocs(collection(db, 'users', userId, 'orders'));
          console.log(`User ${userId} has ${ordersSnapshot.size} orders`);
          
          ordersSnapshot.forEach(orderDoc => {
            const orderData = orderDoc.data();
            // Add user info to order data
            orders.push({
              id: orderDoc.id,
              customerId: userId,
              customerName: userData.name || userData.email || 'Unknown Customer',
              customerEmail: userData.email || '',
              customerPhone: userData.phone || '',
              ...orderData,
              // Ensure status field exists - use orderStatus if status is not available
              status: orderData.status || orderData.orderStatus || 'pending'
            });
          });
        } catch (userError) {
          console.warn(`Error fetching orders for user ${userId}:`, userError.message);
          // Continue with other users even if one fails
        }
      }
      
      console.log(`Total orders found from all customers: ${orders.length}`);
      return orders;
    } catch (error) {
      console.error('Error fetching orders from customer structure:', error);
      throw error;
    }
  },

  // Get orders by status from customer-based structure
  async getByStatus(status) {
    try {
      console.log(`Fetching orders with status: ${status} from customer-based structure...`);
      const orders = [];
      
      // First, get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log(`Found ${usersSnapshot.size} users`);
      
      // For each user, get their orders with the specified status
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        try {
          // Get orders for this user
          const ordersSnapshot = await getDocs(collection(db, 'users', userId, 'orders'));
          console.log(`User ${userId} has ${ordersSnapshot.size} orders`);
          
          ordersSnapshot.forEach(orderDoc => {
            const orderData = orderDoc.data();
            // Check if order matches the requested status
            const orderStatus = orderData.status || orderData.orderStatus || 'pending';
            if (orderStatus === status) {
              orders.push({
                id: orderDoc.id,
                customerId: userId,
                customerName: userData.name || userData.email || 'Unknown Customer',
                customerEmail: userData.email || '',
                customerPhone: userData.phone || '',
                ...orderData,
                status: orderStatus
              });
            }
          });
        } catch (userError) {
          console.warn(`Error fetching orders for user ${userId}:`, userError.message);
          // Continue with other users even if one fails
        }
      }
      
      console.log(`Found ${orders.length} orders with status: ${status}`);
      return orders;
    } catch (error) {
      console.error('Error fetching orders by status from customer structure:', error);
      throw error;
    }
  },

  // Add new order to customer-based structure
  async add(orderData) {
    try {
      // If customerId is provided, add order under that customer
      if (orderData.customerId) {
        const docRef = await addDoc(collection(db, 'users', orderData.customerId, 'orders'), {
          ...orderData
        });
        
        console.log('Order added to customer', orderData.customerId, 'with ID:', docRef.id);
        return {
          id: docRef.id,
          ...orderData
        };
      } else {
        // Fallback to general orders collection if no customerId
        const docRef = await addDoc(collection(db, 'orders'), {
          ...orderData
        });
        
        console.log('Order added with ID:', docRef.id);
        return {
          id: docRef.id,
          ...orderData
        };
      }
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  },

  // Update order in customer-based structure
  async update(orderId, orderData) {
    try {
      // If customerId is provided, update order under that customer
      if (orderData.customerId) {
        await updateDoc(doc(db, 'users', orderData.customerId, 'orders', orderId), {
          ...orderData
        });
        
        console.log('Order updated successfully in customer', orderData.customerId);
        return {
          id: orderId,
          ...orderData
        };
      } else {
        // Fallback to general orders collection if no customerId
        await updateDoc(doc(db, 'orders', orderId), {
          ...orderData
        });
        
        console.log('Order updated successfully');
        return {
          id: orderId,
          ...orderData
        };
      }
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Delete order from customer-based structure
  async delete(orderId, customerId = null) {
    try {
      // If customerId is provided, delete from customer orders
      if (customerId) {
        await deleteDoc(doc(db, 'users', customerId, 'orders', orderId));
        console.log('Order deleted successfully from customer', customerId);
      } else {
        // Try to find the order first to get customerId
        const order = await this.getById(orderId);
        if (order && order.customerId) {
          await deleteDoc(doc(db, 'users', order.customerId, 'orders', orderId));
          console.log('Order deleted successfully from customer', order.customerId);
        } else {
          // Fallback to general orders collection
          await deleteDoc(doc(db, 'orders', orderId));
          console.log('Order deleted successfully');
        }
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },

  // Get single order from customer-based structure
  async getById(orderId, customerId = null) {
    try {
      // If customerId is provided, get from customer orders
      if (customerId) {
        const docRef = doc(db, 'users', customerId, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            customerId: customerId,
            ...data,
            // Ensure status field exists - use orderStatus if status is not available
            status: data.status || data.orderStatus || 'pending'
          };
        } else {
          throw new Error('Order not found');
        }
      } else {
        // Try to find the order by searching through all users
        console.log(`Searching for order ${orderId} in all customer orders...`);
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const userData = userDoc.data();
          
          try {
            const orderDocRef = doc(db, 'users', userId, 'orders', orderId);
            const orderDocSnap = await getDoc(orderDocRef);
            
            if (orderDocSnap.exists()) {
              const orderData = orderDocSnap.data();
              return {
                id: orderDocSnap.id,
                customerId: userId,
                customerName: userData.name || userData.email || 'Unknown Customer',
                customerEmail: userData.email || '',
                customerPhone: userData.phone || '',
                ...orderData,
                // Ensure status field exists - use orderStatus if status is not available
                status: orderData.status || orderData.orderStatus || 'pending'
              };
            }
          } catch (userError) {
            console.warn(`Error checking order for user ${userId}:`, userError.message);
          }
        }
        
        // Fallback to general orders collection
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            // Ensure status field exists - use orderStatus if status is not available
            status: data.status || data.orderStatus || 'pending'
          };
        } else {
          throw new Error('Order not found');
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Update order status in customer-based structure
  async updateStatus(orderId, status, customerId = null) {
    try {
      // If customerId is provided, update in customer orders
      if (customerId) {
        await updateDoc(doc(db, 'users', customerId, 'orders', orderId), {
          orderStatus: status,
          status: status  // Also update the status field for consistency
        });
        console.log('Order status updated successfully in customer', customerId);
      } else {
        // Try to find the order first to get customerId
        const order = await this.getById(orderId);
        if (order && order.customerId) {
          await updateDoc(doc(db, 'users', order.customerId, 'orders', orderId), {
            orderStatus: status,
            status: status  // Also update the status field for consistency
          });
          console.log('Order status updated successfully in customer', order.customerId);
        } else {
          // Fallback to general orders collection
          await updateDoc(doc(db, 'orders', orderId), {
            orderStatus: status,
            status: status  // Also update the status field for consistency
          });
          console.log('Order status updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Update payment status in customer-based structure
  async updatePaymentStatus(orderId, paymentStatus, customerId = null) {
    try {
      // If customerId is provided, update in customer orders
      if (customerId) {
        await updateDoc(doc(db, 'users', customerId, 'orders', orderId), {
          paymentStatus: paymentStatus
        });
        console.log('Payment status updated successfully in customer', customerId);
      } else {
        // Try to find the order first to get customerId
        const order = await this.getById(orderId);
        if (order && order.customerId) {
          await updateDoc(doc(db, 'users', order.customerId, 'orders', orderId), {
            paymentStatus: paymentStatus
          });
          console.log('Payment status updated successfully in customer', order.customerId);
        } else {
          // Fallback to general orders collection
          await updateDoc(doc(db, 'orders', orderId), {
            paymentStatus: paymentStatus
          });
          console.log('Payment status updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
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
      // Try the new subcollection structure first
      try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);
        const messages = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`✅ Found ${messages.length} messages in subcollection for conversation ${conversationId}`);
        return messages;
      } catch (subcollectionError) {
        console.log('🔄 Subcollection not found, trying old structure...');
        
        // Fallback to old structure
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
        console.log(`✅ Found ${messages.length} messages in old structure for conversation ${conversationId}`);
        return messages;
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw error;
    }
  },

  // Send a new message
  async sendMessage(messageData) {
    try {
      console.log('📤 Sending message:', messageData);
      
      const message = {
        ...messageData,
        timestamp: serverTimestamp(),
        status: 'sent'
      };
      
      const docRef = await addDoc(collection(db, 'messages'), message);
      console.log('✅ Message sent with ID:', docRef.id);
      
      // Update conversation with last message
      await this.updateConversation(messageData.conversationId, {
        lastMessage: messageData.message,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: messageData.senderId
      });
      
      console.log('✅ Conversation updated for ID:', messageData.conversationId);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  },

  // Create or update conversation
  async createConversation(conversationData) {
    try {
      const conversation = {
        ...conversationData,
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
    console.log('📡 Setting up message subscription for conversation:', conversationId);
    
    // Fallback function for old message structure
    const fallbackToOldMessageStructure = (conversationId, callback) => {
      console.log('🔄 Falling back to old message structure');
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      
      return onSnapshot(q, (querySnapshot) => {
        console.log('📨 Message snapshot received from old structure:', querySnapshot.size, 'messages');
        const messages = querySnapshot.docs.map(doc => {
          const messageData = { id: doc.id, ...doc.data() };
          console.log('💬 Message data from old structure:', messageData);
          return messageData;
        });
        console.log('📋 All messages for conversation from old structure:', messages);
        callback(messages);
      }, (error) => {
        console.error('❌ Error in old message subscription:', error);
        callback([]);
      });
    };
    
    // Try the new subcollection structure first (conversations/{conversationId}/messages)
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      return onSnapshot(q, (querySnapshot) => {
        console.log('📨 Message snapshot received from subcollection:', querySnapshot.size, 'messages');
        const messages = querySnapshot.docs.map(doc => {
          const messageData = { id: doc.id, ...doc.data() };
          console.log('💬 Message data from subcollection:', messageData);
          return messageData;
        });
        console.log('📋 All messages for conversation from subcollection:', messages);
        callback(messages);
      }, (error) => {
        console.error('❌ Error in subcollection message subscription:', error);
        // Fallback to old structure
        fallbackToOldMessageStructure(conversationId, callback);
      });
    } catch (error) {
      console.error('❌ Error setting up subcollection subscription, falling back to old structure:', error);
      return fallbackToOldMessageStructure(conversationId, callback);
    }
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

      // Generate productId if not provided
      const productId = productData.productId || `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
        image: imageUrls[0] || null, // Keep backward compatibility
        productId: productId
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
        image: imageUrls[0] || null,
        productId: productId
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

      // Create banner data without price and title for Firebase
      const firebaseData = {
        status: posterData.status || 'active',
        image: imageUrl,
        bannerId: autoBannerId,
        bannerName: posterData.bannerName || null,
        productId: posterData.productId || null
      };

      // Only add description if provided
      if (posterData.description) {
        firebaseData.description = posterData.description;
      }

      const docRef = await addDoc(collection(db, 'posters'), firebaseData);

      return {
        id: docRef.id,
        status: posterData.status || 'active',
        image: imageUrl,
        bannerId: autoBannerId,
        bannerName: posterData.bannerName || null,
        productId: posterData.productId || null
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

// Coupon Services
// Notification Services for FCM
export const notificationService = {
  // Send notification to specific admin by FCM token
  async sendToAdmin(fcmToken, notification, data = {}) {
    try {
      // This would typically be done from your backend server
      // For now, we'll just log the notification details
      console.log('📤 Sending notification to admin:', {
        token: fcmToken,
        notification: notification,
        data: data
      });
      
      // In a real implementation, you would call your backend API
      // which would use Firebase Admin SDK to send the notification
      return {
        success: true,
        message: 'Notification queued for sending'
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  // Send notification to all active admins
  async sendToAllAdmins(notification, data = {}) {
    try {
      const admins = await adminService.getAll();
      const activeAdminsWithTokens = admins.filter(admin => 
        admin.status === 'active' && admin.fcmToken
      );
      
      console.log(`📤 Sending notification to ${activeAdminsWithTokens.length} active admins`);
      
      const results = [];
      for (const admin of activeAdminsWithTokens) {
        try {
          const result = await this.sendToAdmin(admin.fcmToken, notification, data);
          results.push({ adminId: admin.id, success: true, result });
        } catch (error) {
          results.push({ adminId: admin.id, success: false, error: error.message });
        }
      }
      
      return {
        success: true,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length,
        results: results
      };
    } catch (error) {
      console.error('Error sending notification to all admins:', error);
      throw error;
    }
  },

  // Log notification history (for tracking)
  async logNotification(notificationData) {
    try {
      const logData = {
        ...notificationData,
        sentAt: new Date().toISOString(),
        status: 'sent'
      };
      
      const docRef = await addDoc(collection(db, 'notification_logs'), logData);
      console.log('Notification logged with ID:', docRef.id);
      return { id: docRef.id, ...logData };
    } catch (error) {
      console.error('Error logging notification:', error);
      throw error;
    }
  },

  // Get notification history
  async getNotificationHistory(limit = 50) {
    try {
      const q = query(
        collection(db, 'notification_logs'),
        orderBy('sentAt', 'desc'),
        limit(limit)
      );
      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return notifications;
    } catch (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }
  }
};

export const couponService = {
  // Get all coupons
  async getAll() {
    try {
      console.log('Fetching data from coupons collection...');
      const querySnapshot = await getDocs(collection(db, 'coupons'));
      const coupons = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          validUntil: data.validUntil?.toDate?.() || new Date()
        };
      });
      console.log('Coupons found:', coupons.length);
      return coupons;
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  },

  // Get coupon by code
  async getByCode(code) {
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        validUntil: data.validUntil?.toDate?.() || new Date()
      };
    } catch (error) {
      console.error('Error fetching coupon by code:', error);
      throw error;
    }
  },

  // Add new coupon
  async add(couponData) {
    try {
      // Check if coupon code already exists
      const existingCoupon = await this.getByCode(couponData.code);
      if (existingCoupon) {
        throw new Error('Coupon code already exists');
      }

      const docRef = await addDoc(collection(db, 'coupons'), {
        ...couponData,
        code: couponData.code.toUpperCase(),
        validUntil: new Date(couponData.validUntil),
        usageCount: 0,
        isActive: true
      });
      
      console.log('Coupon added with ID:', docRef.id);
      return {
        id: docRef.id,
        ...couponData,
        code: couponData.code.toUpperCase(),
        validUntil: new Date(couponData.validUntil),
        usageCount: 0,
        isActive: true
      };
    } catch (error) {
      console.error('Error adding coupon:', error);
      throw error;
    }
  },

  // Update coupon
  async update(couponId, couponData) {
    try {
      // If code is being updated, check for duplicates
      if (couponData.code) {
        const existingCoupon = await this.getByCode(couponData.code);
        if (existingCoupon && existingCoupon.id !== couponId) {
          throw new Error('Coupon code already exists');
        }
        couponData.code = couponData.code.toUpperCase();
      }

      const updateData = {
        ...couponData
      };

      if (couponData.validUntil) {
        updateData.validUntil = new Date(couponData.validUntil);
      }

      await updateDoc(doc(db, 'coupons', couponId), updateData);
      
      console.log('Coupon updated with ID:', couponId);
      return {
        id: couponId,
        ...couponData
      };
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  },

  // Delete coupon
  async delete(couponId) {
    try {
      console.log('Delete coupon method called with ID:', couponId);
      await deleteDoc(doc(db, 'coupons', couponId));
      console.log('Coupon deleted successfully');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      throw error;
    }
  },

  // Get coupon by ID
  async getById(couponId) {
    try {
      const docRef = doc(db, 'coupons', couponId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          validUntil: data.validUntil?.toDate?.() || new Date()
        };
      } else {
        throw new Error('Coupon not found');
      }
    } catch (error) {
      console.error('Error fetching coupon:', error);
      throw error;
    }
  },

  // Toggle coupon status
  async toggleStatus(couponId, isActive) {
    try {
      await updateDoc(doc(db, 'coupons', couponId), {
        isActive: isActive
      });
      
      console.log('Coupon status updated:', couponId, isActive);
      return { id: couponId, isActive };
    } catch (error) {
      console.error('Error updating coupon status:', error);
      throw error;
    }
  },

  // Validate coupon for use
  async validateCoupon(code, orderAmount = 0) {
    try {
      const coupon = await this.getByCode(code);
      
      if (!coupon) {
        return { valid: false, message: 'Coupon not found' };
      }

      if (!coupon.isActive) {
        return { valid: false, message: 'Coupon is inactive' };
      }

      if (new Date() > coupon.validUntil) {
        return { valid: false, message: 'Coupon has expired' };
      }

      if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
        return { valid: false, message: 'Coupon usage limit reached' };
      }

      if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
        return { 
          valid: false, 
          message: `Minimum order amount of ₹${coupon.minOrderAmount} required` 
        };
      }

      return { 
        valid: true, 
        coupon: coupon,
        message: 'Coupon is valid' 
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { valid: false, message: 'Error validating coupon' };
    }
  },

  // Use coupon (increment usage count)
  async useCoupon(couponId) {
    try {
      const coupon = await this.getById(couponId);
      await updateDoc(doc(db, 'coupons', couponId), {
        usageCount: (coupon.usageCount || 0) + 1
      });
      
      console.log('Coupon usage incremented:', couponId);
      return true;
    } catch (error) {
      console.error('Error using coupon:', error);
      throw error;
    }
  }
};