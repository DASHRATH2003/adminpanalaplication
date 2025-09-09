import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Layers,
  Layers3,
  Tag,
  ShoppingCart,
  Ticket,
  Image,
  User,
  MessageCircle,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/category', icon: FolderOpen, label: 'Category' },
    { path: '/sub-category', icon: Layers, label: 'Sub Category' },
    { path: '/sub-under-category', icon: Layers3, label: 'Sub Under Category' },
    { path: '/brands', icon: Tag, label: 'Brands' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/coupons', icon: Ticket, label: 'Coupons' },
    { path: '/posters', icon: Image, label: 'Posters' },
    { path: '/profile', icon: User, label: 'Profile' },

  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`w-64 bg-gray-900 text-white h-full fixed left-0 top-0 overflow-y-auto z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-semibold">Shop</span>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      </div>
    </>
  );
};

export default Sidebar;