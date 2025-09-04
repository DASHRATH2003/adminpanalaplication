import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Category from './pages/Category';
import SubCategory from './pages/SubCategory';
import Brands from './pages/Brands';
import VariantType from './pages/VariantType';
import Variants from './pages/Variants';
import Orders from './pages/Orders';
import Coupons from './pages/Coupons';
import Posters from './pages/Posters';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Main App Routes */}
        <Route path="/*" element={
          <div className="flex bg-gray-900 min-h-screen">
            <Sidebar />
            <div className="flex-1">
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/category" element={<Category />} />
                  <Route path="/sub-category" element={<SubCategory />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/variant-type" element={<VariantType />} />
                  <Route path="/variants" element={<Variants />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/coupons" element={<Coupons />} />
                  <Route path="/posters" element={<Posters />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
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