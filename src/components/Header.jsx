import React, { useState } from 'react';
import { Search, ChevronDown, User, LogOut, Settings, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Navigate to login page
    navigate('/login');
  };

  return (
    <header className="bg-gray-800 text-white px-6 py-4 ml-64">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>

        {/* Search and User Profile */}
        <div className="flex items-center space-x-6">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="bg-gray-700 text-white placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
            />
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <span className="font-medium">DrDisagree</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg border border-gray-600 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-600">
                    <p className="text-sm font-medium text-white">DrDisagree</p>
                    <p className="text-xs text-gray-400">admin@shop.com</p>
                  </div>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2">
                    <UserCircle size={16} />
                    <span>Profile</span>
                  </button>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2">
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  
                  <div className="border-t border-gray-600 mt-2 pt-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 hover:text-red-300 flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;