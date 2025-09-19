import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Category from './pages/Category';
import SubCategory from './pages/SubCategory';
import SubUnderCategory from './pages/SubUnderCategory';
import Brands from './pages/Brands';
import VariantType from './pages/VariantType';
import Variants from './pages/Variants';
import Orders from './pages/Orders';
import Sellers from './pages/Sellers';
import Customers from './pages/Customers';
import Messages from './pages/Messages';
import Coupons from './pages/Coupons';
import Posters from './pages/Posters';

import Profile from './pages/Profile';
import JsonUploadPage from './pages/JsonUploadPage';

import Login from './pages/Login';
import Register from './pages/Register';
import { fcmUtils } from './utils/fcmUtils';
import './utils/fcmDebugger'; // For debugging FCM issues

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Check authentication status on app load
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (authToken && userData) {
      setIsAuthenticated(true);
    }
    
    // Setup FCM foreground message listener
    if (fcmUtils.isSupported()) {
      fcmUtils.setupForegroundMessageListener();
      console.log('✅ FCM foreground message listener setup completed');
    }
    
    setIsLoading(false);
  }, []);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Login Route - accessible only when not authenticated */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login setIsAuthenticated={setIsAuthenticated} />} 
        />
        
        {/* Register Route - accessible only when not authenticated */}
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
        />
        
        {/* Protected Routes - accessible only when authenticated */}
        <Route 
          path="/*" 
          element={
            isAuthenticated ? (
              <div className="flex bg-gray-900 h-screen overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
                <div className="flex-1 lg:ml-64 flex flex-col">
                  <Header onToggleSidebar={toggleSidebar} setIsAuthenticated={setIsAuthenticated} />
                  <main className="flex-1 overflow-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/category" element={<Category />} />
                      <Route path="/sub-category" element={<SubCategory />} />
                      <Route path="/sub-under-category" element={<SubUnderCategory />} />
                      <Route path="/brands" element={<Brands />} />
                      <Route path="/variant-type" element={<VariantType />} />
                      <Route path="/variants" element={<Variants />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/sellers" element={<Sellers />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/coupons" element={<Coupons />} />
                      <Route path="/posters" element={<Posters />} />
                      <Route path="/json-upload" element={<JsonUploadPage />} />
      
                      <Route path="/profile" element={<Profile />} />
                    </Routes>
                  </main>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;