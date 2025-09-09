import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

import Login from './pages/Login';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Main App Routes */}
        <Route path="/*" element={
          <div className="flex bg-gray-900 h-screen overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
            <div className="flex-1 lg:ml-64 flex flex-col">
              <Header onToggleSidebar={toggleSidebar} />
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
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </main>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;