import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Phone, Video, MoreVertical, User, Clock, Check, CheckCheck, Bell, BellOff, RefreshCw } from 'lucide-react';
import { serverTimestamp } from "firebase/firestore";
import { collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

import { messageService, userService } from '../firebase/services';
import { generateToken, onMessageListener, setupBackgroundMessageHandler } from '../firebase/messaging';
import { setupUniversalFCM, universalFCMManager } from '../utils/universalFCM';
import { sendNotificationViaCloudFunction } from '../firebase/sendNotification';
import { setupAutoPresence, subscribeToMultipleUsersPresence } from '../firebase/presence';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersPresence, setUsersPresence] = useState({}); // Track online status of users
  const [fcmToken, setFcmToken] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [notificationBanner, setNotificationBanner] = useState({ show: false, title: '', message: '' });
  const messagesEndRef = useRef(null);
  const unsubscribeConversations = useRef(null);
  const unsubscribeMessages = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Notification setup and management
  const setupNotifications = async () => {
    try {
      // Setup background message handler
      setupBackgroundMessageHandler();
      
      // Check current permission status
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Generate FCM token
      const token = await generateToken();
      if (token) {
        setFcmToken(token);
        setNotificationsEnabled(true);
        
        // Save token to database or localStorage
        localStorage.setItem('fcmToken', token);
        
        // Setup foreground message listener
        setupForegroundMessageListener();
        
        // Show success notification
        showNotificationInUI('Notifications Enabled', 'You will now receive notifications');
      } else {
        console.error('Failed to generate FCM token');
        setNotificationsEnabled(false);
        showNotificationInUI('Notification Error', 'Failed to enable notifications');
      }
      } else {
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setNotificationsEnabled(false);
    }
  };

  // Foreground message listener setup
  const setupForegroundMessageListener = () => {
    onMessageListener().then((payload) => {
      // Show notification in UI
      if (payload.notification) {
        showNotificationInUI(payload.notification.title || 'New Message', payload.notification.body || 'You have a new message');
      }
    }).catch((error) => {
      console.error('Error in foreground message listener:', error);
    });
  };

  // Show notification in UI (when app is open)
  const showNotificationInUI = (title, message) => {
    setNotificationBanner({ show: true, title, message });
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setNotificationBanner({ show: false, title: '', message: '' });
    }, 5000);
  };

  // Send notification to specific user
  const sendNotificationToUser = async (token, title, body) => {
    try {
      // Use a proxy server to avoid CORS issues
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const fcmUrl = 'https://fcm.googleapis.com/fcm/send';
      
      const response = await fetch(proxyUrl + fcmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'key=AAAAZdRr3XA:APA91bF5Y6P1r0k6kPq7v8v9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x1y2z3',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: title,
            body: body,
            sound: 'default',
            icon: '/sadhanacutlogo.jpeg'
          },
          data: {
            type: 'message',
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
          priority: 'high'
        })
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        showNotificationInUI(`✅ Notification sent successfully!`);
        return { success: true };
      } else {
        showNotificationInUI(`❌ FCM Error: ${responseData.results?.[0]?.error || 'Unknown error'}`);
        return { success: false, error: responseData.results?.[0]?.error || 'Failed to send notification' };
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      showNotificationInUI(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Toggle notifications
  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      // Disable notifications
      setNotificationsEnabled(false);
      setFcmToken('');
      localStorage.removeItem('fcmToken');
      showNotificationInUI('Notifications Disabled', 'You have disabled notifications');
    } else {
      // Enable notifications
      await setupNotifications();
    }
  };

  // Generate FCM token for user manually
  const generateTokenForUser = async (user) => {
    try {
      // Check if user already has token
      if (user.fcmToken) {
        showNotificationInUI('Token Exists', 'User already has FCM token');
        return;
      }

      // Generate token using universal manager
      const token = await universalFCMManager.generateTokenForUser(user.id, user.email);
      
      if (token) {
        showNotificationInUI('Success', `FCM token generated for ${user.name || user.email}`);
        // Reload users to show updated token
        await loadUsers();
      } else {
        showNotificationInUI('Error', 'Failed to generate FCM token. Check browser permissions.');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      showNotificationInUI('Error', `Failed to generate token: ${error.message}`);
    }
  };

  // Send notification to selected user with retry logic
  const sendNotificationToSelectedUser = async (user) => {
    if (!user.fcmToken) {
      showNotificationInUI('Error', 'User has no FCM token saved');
      return;
    }

    try {
      // Show sending status
      showNotificationInUI('Sending...', 'Sending notification to user...');
      
      await sendNotificationToUser(
        user.fcmToken, 
        'Message from Admin', 
        'आपका order ready है!'
      );
      
      showNotificationInUI('✅ Success', `Notification sent to ${user.name || user.email}`);
      
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      
      // Check if it's a token error
      if (error.message.includes('NotRegistered') || error.message.includes('InvalidRegistration')) {
        showNotificationInUI('❌ Token Error', 'User FCM token is invalid or expired. Ask user to regenerate token.');
      } else if (error.message.includes('MissingRegistration')) {
        showNotificationInUI('❌ Missing Token', 'No FCM token provided');
      } else {
        showNotificationInUI('❌ Error', `Failed to send notification: ${error.message}`);
      }
    }
  };

  // Load conversations and users on component mount
  useEffect(() => {
    // Load users first, then conversations
    loadUsers().then(() => {
      loadConversations();
    });
    
    // Setup notifications on component mount
    setupNotifications();
    
    // Check if notifications were previously enabled
    const savedToken = localStorage.getItem('fcmToken');
    if (savedToken) {
      setFcmToken(savedToken);
      setNotificationsEnabled(true);
      setupForegroundMessageListener();
    }
    
    // Setup auto presence for admin
    const cleanupPresence = setupAutoPresence('admin');
    
    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribeConversations.current) {
        unsubscribeConversations.current();
      }
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }
      cleanupPresence();
    };
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Refresh conversations when users are updated
  useEffect(() => {
    if (users.length > 0 && conversations.length > 0) {
      refreshConversationsWithTokens();
    }
  }, [users]);

  // Direct Firebase check for specific user
  const checkFirebaseDirectly = async () => {
    try {
      const userDocRef = doc(db, 'users', 'NvqxrYIpOcYbGXLZhYEUjoPRZer2');
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        
        // Check if token exists but might be hidden
        if (userData.fcmToken || userData.token) {
          // FCM token found
        } else {
          // No FCM token found
        }
        
      } else {
        // User document not found in Firebase
      }
      
    } catch (error) {
      console.error('❌ Error checking Firebase directly:', error);
    }
  };

  // Test function to load specific conversation
  const testLoadSpecificConversation = () => {
    const testConversation = {
      id: 'support_NvqxrYIpOcYbGXLZhYEUjoPRZer2',
      customerId: 'NvqxrYIpOcYbGXLZhYEUjoPRZer2',
      customerName: 'Test User',
      isSupportConversation: true
    };
    
    console.log('🧪 Testing specific conversation load...');
    console.log('📋 Test conversation:', testConversation);
    
    setSelectedConversation(testConversation);
    loadMessages(testConversation.id);
    
    alert('Test conversation loaded! Check console for details.');
  };









  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // Subscribe to real-time conversations
      unsubscribeConversations.current = messageService.subscribeToConversations(async (conversationsData) => {
        console.log('📋 Raw conversations from Firebase:', conversationsData);
        
        // Process all conversations - both regular customer conversations and support conversations
        const enrichedConversations = await Promise.all(
          conversationsData.map(async (conversation) => {
            try {
              console.log('🔍 Processing conversation:', conversation.id, conversation);
              
              // Handle support conversations (conversations starting with 'support_')
              if (conversation.id && conversation.id.startsWith('support_')) {
                // For support conversations, extract user ID from the conversation ID
                // Format: support_USERID
                const userId = conversation.id.replace('support_', '');
                console.log('🎯 Support conversation found! User ID:', userId);
                console.log('🔍 Full conversation data:', conversation);
                
                // Special check for the specific conversation
                if (conversation.id === 'support_NvqxrYIpOcYbGXLZhYEUjoPRZer2') {
                  console.log('🚨 FOUND THE SPECIFIC SUPPORT CONVERSATION!');
                }
                
                const user = users.find(u => u.id === userId);
                console.log('👤 Found user for support conversation:', user);
                
                const enrichedConv = {
                  ...conversation,
                  customerId: userId,
                  customerName: conversation.customerName || (user ? user.name : 'Support User'),
                  customerEmail: conversation.customerEmail || (user ? user.email : ''),
                  customerToken: user ? (user.fcmToken || null) : null,
                  isSupportConversation: true
                };
                
                console.log('✅ Enriched support conversation:', enrichedConv);
                return enrichedConv;
              }
              
              // Handle regular customer conversations
              const user = users.find(u => 
                u.id === conversation.customerId || 
                u.email === conversation.customerEmail
              );
              
              if (user && user.fcmToken) {
                return {
                  ...conversation,
                  customerToken: user.fcmToken
                };
              } else {
                return {
                  ...conversation,
                  customerToken: null
                };
              }
            } catch (error) {
              console.error(`❌ Error enriching conversation for user ${conversation.customerName}:`, error);
              return {
                ...conversation,
                customerToken: null
              };
            }
          })
        );
        
        console.log('✅ Final enriched conversations:', enrichedConversations);
        setConversations(enrichedConversations);
        
        if (enrichedConversations.length > 0 && !selectedConversation) {
          setSelectedConversation(enrichedConversations[0]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  // Load users from Firebase with FCM tokens
  const loadUsers = async () => {
    try {
      console.log('🔄 Loading users from Firebase...');
      const usersData = await userService.getAll();
      console.log('📋 Raw users data:', usersData);
      
      // Add FCM tokens to users if available
      const usersWithTokens = usersData.map(user => {
        // Check if user has FCM token regardless of status
        const hasToken = !!(user.fcmToken || user.token);
        const finalToken = user.fcmToken || user.token || null;
        
        // Check for the specific user ID
        if (user.id === 'NvqxrYIpOcYbGXLZhYEUjoPRZer2') {
          console.log('🚨 FOUND THE SPECIFIC USER!', user);
        }
        
        return {
          ...user,
          fcmToken: finalToken,
          hasFCMToken: hasToken,
          fcmTokenStatus: user.fcmTokenStatus || (hasToken ? 'Available' : 'Not Available')
        };
      });
      
      console.log('✅ Users with tokens:', usersWithTokens);
      setUsers(usersWithTokens);
      
      // Subscribe to presence updates for all users
      const userIds = usersWithTokens.map(user => user.id).filter(id => id);
      
      const unsubscribePresence = subscribeToMultipleUsersPresence(userIds, (presenceData) => {
        setUsersPresence(presenceData);
      });
      
      // Store cleanup function
      if (window.presenceCleanup) {
        window.presenceCleanup();
      }
      window.presenceCleanup = unsubscribePresence;
      
      return usersWithTokens;
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  };

  // Refresh conversations with updated user data
  const refreshConversationsWithTokens = async () => {
    try {
      // Get current conversations
      const currentConversations = conversations;
      
      // Enrich conversations with updated user FCM tokens
      const enrichedConversations = await Promise.all(
        currentConversations.map(async (conversation) => {
          try {
            // Find user by customerId or customerEmail
            const user = users.find(u => 
              u.id === conversation.customerId || 
              u.email === conversation.customerEmail
            );
            
            if (user && user.fcmToken) {
              return {
                ...conversation,
                customerToken: user.fcmToken
              };
            } else {
              return {
                ...conversation,
                customerToken: null
              };
            }
          } catch (error) {
            console.error(`Error refreshing conversation for user ${conversation.customerName}:`, error);
            return {
              ...conversation,
              customerToken: null
            };
          }
        })
      );
      
      setConversations(enrichedConversations);
      
      // Update selected conversation if it exists
      if (selectedConversation) {
        const updatedSelected = enrichedConversations.find(conv => conv.id === selectedConversation.id);
        if (updatedSelected) {
          setSelectedConversation(updatedSelected);
        }
      }
      
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      console.log('📩 Loading messages for conversation:', conversationId);
      
      // Special test for the specific conversation
      if (conversationId === 'support_NvqxrYIpOcYbGXLZhYEUjoPRZer2') {
        console.log('🚨 LOADING MESSAGES FOR THE SPECIFIC SUPPORT CONVERSATION!');
      }
      
      // Unsubscribe from previous messages subscription
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }
      
      // Clear messages first to prevent showing old messages
      setMessages([]);
      
      // Subscribe to real-time messages for selected conversation
      unsubscribeMessages.current = messageService.subscribeToMessages(conversationId, (messagesData) => {
        console.log('📨 Received messages for conversation', conversationId, ':', messagesData);
        console.log('📊 Message count:', messagesData.length);
        console.log('📋 All messages:', messagesData);
        
        // Filter messages to ensure they belong to current conversation only
        const filteredMessages = messagesData.filter(msg => msg.conversationId === conversationId);
        console.log('🔍 Filtered messages:', filteredMessages);
        console.log('🔄 Setting messages in state...');
        
        setMessages(filteredMessages);
        
        console.log('✅ Messages loaded successfully');
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Handle user click to start new conversation
  const handleUserClick = async (user) => {
    console.log('👤 User clicked:', user);
    
    try {
      // Clear messages first to prevent showing old messages
      setMessages([]);
      
      // Check if conversation already exists with this user
      const existingConversation = conversations.find(conv => 
        conv.customerId === user.id || conv.customerEmail === user.email
      );
      
      console.log('💬 Found conversation:', existingConversation);
      console.log('📋 All conversations:', conversations);
      
      if (existingConversation) {
        console.log('🔄 Setting selected conversation and loading messages...');
        setSelectedConversation(existingConversation);
        loadMessages(existingConversation.id);
      } else {
        // Create new conversation
        console.log('🆕 Creating new conversation for user:', user);
        const conversationData = {
          customerId: user.id,
          customerName: user.name || user.email || 'Unknown User',
          customerEmail: user.email,
          customerPhone: user.phone || '',
          avatar: user.profileImage || '',
          isOnline: user.isOnline || false,
          customerToken: user.fcmToken || null, // Add FCM token
          lastMessage: '',
          lastMessageTime: null,
          unreadCount: 0
        };
        
        const conversationId = await messageService.createConversation(conversationData);
        
        // Create conversation object with ID
        const newConversation = {
          id: conversationId,
          ...conversationData
        };
        
        // Select the new conversation
        setSelectedConversation(newConversation);
        loadMessages(conversationId);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };





  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedConversation) {
      try {
        const messageData = {
          conversationId: selectedConversation.id,
          senderId: 'admin',
          senderName: 'Admin',
          senderType: 'admin',
          message: newMessage.trim(),
          recipientId: selectedConversation.customerId,
          recipientName: selectedConversation.customerName
        };

        const messageId = await messageService.sendMessage(messageData);
        
        // Send notification to user
        if (notificationsEnabled && selectedConversation.customerToken) {
          try {
            await sendNotificationToUser(
              selectedConversation.customerToken,
              'New Message from Admin',
              newMessage.trim(),
              {
                conversationId: selectedConversation.id,
                senderId: 'admin',
                senderName: 'Admin',
                messageType: 'text'
              }
            );
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
            // Don't fail the message send if notification fails
          }
        }
        
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      }
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={14} className="text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-900 h-full">
      <div className="max-w-7xl mx-auto h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Messages</h1>
          <button
            onClick={testLoadSpecificConversation}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Test Support Conversation
          </button>
          <div className="flex items-center space-x-4">
            {/* Notification Status */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              notificationsEnabled 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}>
              {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
              <span className="text-sm font-medium">
                {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
              </span>
            </div>

            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">
                {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)} Unread
              </span>
            </div>
          </div>
        </div>

        {/* Notification Banner */}
        {notificationBanner.show && (
          <div className="mb-4 p-4 bg-blue-600 text-white rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell size={20} />
              <div>
                <h4 className="font-medium">{notificationBanner.title}</h4>
                <p className="text-sm opacity-90">{notificationBanner.message}</p>
              </div>
            </div>
            <button
              onClick={() => setNotificationBanner({ show: false, title: '', message: '' })}
              className="text-white hover:text-gray-200 p-1 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-gray-800 rounded-lg h-[calc(100vh-200px)] flex">
          {/* Conversations List */}
          <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/3 border-r border-gray-700 flex-col`}>
            {/* Search */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Messages</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Combined Users and Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {/* Available Users Section */}
              {users.filter(user => !conversations.some(conv => conv.customerId === user.id || conv.customerEmail === user.email)).length > 0 && (
                <>
                  <div className="p-3 bg-gray-750 border-b border-gray-600 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">Available Users</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    {users.filter(u => u.fcmToken).length}/{users.length} have tokens
                  </span>
                  <button
                    onClick={async () => {
                      const usersWithoutTokens = users.filter(u => !u.fcmToken);
                      if (usersWithoutTokens.length === 0) {
                        showNotificationInUI('Info', 'All users already have FCM tokens');
                        return;
                      }
                      
                      showNotificationInUI('Processing', `Generating tokens for ${usersWithoutTokens.length} users...`);
                      
                      let successCount = 0;
                      for (const user of usersWithoutTokens) {
                        try {
                          await generateTokenForUser(user);
                          successCount++;
                        } catch (error) {
                          console.error(`Failed to generate token for ${user.name || user.email}:`, error);
                        }
                      }
                      
                      showNotificationInUI('Complete', `Generated ${successCount} FCM tokens successfully`);
                      await loadUsers(); // Reload to show updated tokens
                    }}
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                    title="Generate FCM tokens for all users without tokens"
                  >
                    Generate All
                  </button>
                </div>
              </div>
                  {users.filter(user => !conversations.some(conv => conv.customerId === user.id || conv.customerEmail === user.email)).map((user) => (
                    <div
                      key={`user-${user.id}`}
                      onClick={() => handleUserClick(user)}
                      className="p-3 border-b border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        {/* User Avatar */}
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          {user.profileImage ? (
                            <img src={user.profileImage} alt={user.name || user.email} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <User size={20} className="text-white" />
                          )}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {user.name || user.email || 'Unknown User'}
                          </h4>
                          {user.email && user.name && (
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          )}
                          {user.phone && (
                            <p className="text-xs text-gray-500">{user.phone}</p>
                          )}
                        </div>
                        
                        {/* Online Status */}
                        <div className={`w-2 h-2 rounded-full ${
                          usersPresence[user.id]?.isOnline || user.isOnline ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                        
                        {/* Notification Button */}
                        {user.fcmToken && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendNotificationToSelectedUser(user);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
                            title="Send notification to user"
                          >
                            <Bell size={14} />
                          </button>
                        )}
                        
                        {/* Generate Token Button */}
                        {!user.fcmToken && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generateTokenForUser(user);
                            }}
                            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                            title="Generate FCM token for this user"
                          >
                            🔑
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {/* Active Conversations Section */}
              {filteredConversations.length > 0 && (
                <>
                  <div className="p-3 bg-gray-750 border-b border-gray-600">
                    <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">Active Conversations</span>
                  </div>
                  {filteredConversations.map((conversation) => (
                    <div
                      key={`conv-${conversation.id}`}
                      onClick={() => {
                        setMessages([]);
                        setSelectedConversation(conversation);
                      }}
                      className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            {conversation.avatar ? (
                              <img src={conversation.avatar} alt={conversation.customerName} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <User size={24} className="text-white" />
                            )}
                          </div>
                          {(usersPresence[conversation.customerId]?.isOnline || conversation.isOnline) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                          )}
                        </div>

                        {/* Conversation Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-white font-medium truncate">
                                {conversation.customerName}
                                {conversation.isSupportConversation && (
                                  <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-semibold">
                                    SUPPORT
                                  </span>
                                )}
                              </h3>
                              <span className="text-xs text-gray-400">
                                {conversation.lastMessageTime ? 
                                  new Date(conversation.lastMessageTime.seconds * 1000).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }) : 
                                  'Now'
                                }
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">{conversation.lastMessage}</p>
                            <p className="text-xs text-gray-500 mt-1">{conversation.customerEmail}</p>
                          </div>

                        {/* Unread Count */}
                        {(conversation.unreadCount || 0) > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </div>
                        )}
                        
                        {/* Notification Button for Conversation */}
                        {conversation.customerToken && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendNotificationToSelectedUser({
                                id: conversation.customerId,
                                name: conversation.customerName,
                                email: conversation.customerEmail,
                                fcmToken: conversation.customerToken
                              });
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white p-1 rounded-full transition-colors ml-2"
                            title="Send notification to customer"
                          >
                            <Bell size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {/* Empty State */}
              {users.length === 0 && conversations.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <User size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No users or conversations</h3>
                  <p className="text-sm">Users will appear here when they register</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
        <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors mr-2"
                    >
                      ←
                    </button>
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        {selectedConversation.avatar ? (
                          <img src={selectedConversation.avatar} alt={selectedConversation.customerName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User size={20} className="text-white" />
                        )}
                      </div>
                      {(usersPresence[selectedConversation.customerId]?.isOnline || selectedConversation.isOnline) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        {selectedConversation.customerName}
                        {selectedConversation.isSupportConversation && (
                          <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-semibold">
                            SUPPORT
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {usersPresence[selectedConversation.customerId]?.isOnline || selectedConversation.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Notification Toggle */}
                    <button 
                      onClick={toggleNotifications}
                      className={`p-2 rounded-lg transition-colors ${
                        notificationsEnabled 
                          ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                      title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                    >
                      {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                      <Phone size={20} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                      <Video size={20} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderType === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <div className={`flex items-center justify-between mt-1 ${
                          message.senderType === 'admin' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-xs opacity-70">
                            {message.timestamp ? 
                              new Date(message.timestamp.seconds * 1000).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) : 
                              'Now'
                            }
                          </span>
                          {message.senderType === 'admin' && (
                            <div className="ml-2">
                              {getMessageStatusIcon(message.status)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Select a conversation</h3>
                  <p className="text-gray-400">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;