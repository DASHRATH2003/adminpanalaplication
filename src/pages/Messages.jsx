import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Phone, Video, MoreVertical, User, Clock, Check, CheckCheck } from 'lucide-react';
import { serverTimestamp } from "firebase/firestore";

import { messageService, userService } from '../firebase/services';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const unsubscribeConversations = useRef(null);
  const unsubscribeMessages = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations and users on component mount
  useEffect(() => {
    loadConversations();
    loadUsers();
    
    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribeConversations.current) {
        unsubscribeConversations.current();
      }
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }
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

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // Subscribe to real-time conversations
      unsubscribeConversations.current = messageService.subscribeToConversations((conversationsData) => {
        setConversations(conversationsData);
        if (conversationsData.length > 0 && !selectedConversation) {
          setSelectedConversation(conversationsData[0]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await userService.getAll();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      // Unsubscribe from previous messages subscription
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }
      
      // Clear messages first to prevent showing old messages
      setMessages([]);
      
      // Subscribe to real-time messages for selected conversation
      unsubscribeMessages.current = messageService.subscribeToMessages(conversationId, (messagesData) => {
        // Filter messages to ensure they belong to current conversation only
        const filteredMessages = messagesData.filter(msg => msg.conversationId === conversationId);
        setMessages(filteredMessages);
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Handle user click to start new conversation
  const handleUserClick = async (user) => {
    try {
      // Clear messages first to prevent showing old messages
      setMessages([]);
      
      // Check if conversation already exists with this user
      const existingConversation = conversations.find(conv => 
        conv.customerId === user.id || conv.customerEmail === user.email
      );
      
      if (existingConversation) {
        // Select existing conversation
        setSelectedConversation(existingConversation);
      } else {
        // Create new conversation
        const conversationData = {
          customerId: user.id,
          customerName: user.name || user.email || 'Unknown User',
          customerEmail: user.email,
          customerPhone: user.phone || '',
          avatar: user.profileImage || '',
          isOnline: user.isOnline || false,
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
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };



  // Clear all dummy data function
  const clearAllData = async () => {
    try {
      const confirmClear = window.confirm('Are you sure you want to clear all conversations and messages? This action cannot be undone.');
      if (confirmClear) {
        await messageService.clearAllData();
        setConversations([]);
        setMessages([]);
        setSelectedConversation(null);
        alert('All data cleared successfully!');
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error clearing data: ' + error.message);
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

        await messageService.sendMessage(messageData);
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
          <div className="flex items-center space-x-4">
            <button
              onClick={clearAllData}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear All Data
            </button>
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">
                {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)} Unread
              </span>
            </div>
          </div>
        </div>

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
                  <div className="p-3 bg-gray-750 border-b border-gray-600">
                    <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">Available Users</span>
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
                          user.isOnline ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
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
                          {conversation.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                          )}
                        </div>

                        {/* Conversation Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-white font-medium truncate">{conversation.customerName}</h3>
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
                      {selectedConversation.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{selectedConversation.customerName}</h3>
                      <p className="text-sm text-gray-400">
                        {selectedConversation.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
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