import React from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';

const Orders = () => {
  return (
    <div className="p-6 bg-gray-900 min-h-screen ml-64">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Orders</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <select className="bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
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
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-white mb-4">My Orders</h3>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Customer Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Order Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Edit</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Delete</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                  No orders available
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;