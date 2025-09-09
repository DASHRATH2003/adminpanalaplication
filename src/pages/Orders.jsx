import React from 'react';
import { RefreshCw, ChevronDown, User, CreditCard, Calendar, Edit, Trash2, Package } from 'lucide-react';

const Orders = () => {
  // Sample orders data for demonstration
  const orders = [];

  return (
    <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h2 className="text-xl md:text-2xl font-semibold text-white">Orders</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative">
            <select className="w-full sm:w-auto bg-gray-700 text-white px-3 md:px-4 py-2 pr-8 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm md:text-base">
              <option value="all">All orders</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
          <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
            <RefreshCw size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-white mb-4">My Orders</h3>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Customer Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Order Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <Package className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-lg font-medium text-gray-300">No orders available</p>
                    <p className="text-sm text-gray-400">Orders will appear here when customers place them</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-6 py-4 text-white">{order.customerName}</td>
                    <td className="px-6 py-4 text-white">₹{order.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : order.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'delivered' 
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{order.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-400 hover:text-blue-300">
                          <Edit size={16} />
                        </button>
                        <button className="text-red-400 hover:text-red-300">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {orders.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <p className="text-lg font-medium text-gray-300">No orders available</p>
            <p className="text-sm text-gray-400">Orders will appear here when customers place them</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-gray-800 rounded-lg p-4 shadow-md">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {order.customerName}
                    </div>
                    <div className="text-xs text-gray-400">
                      Order #{order.id}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">₹{order.amount}</div>
                  <div className="text-xs text-gray-400">{order.date}</div>
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-300">
                    <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Payment Status</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : order.paymentStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-300">
                    <Package className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Order Status</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'delivered' 
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'shipped'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-700">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-2">
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-2">
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;