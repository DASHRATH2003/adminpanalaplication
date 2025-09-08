import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

const Coupons = () => {
  return (
    <div className="p-4 lg:p-6 bg-gray-900 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Coupons</h2>
        <div className="flex items-center space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus size={20} />
            <span>Add Coupon</span>
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-white mb-4">My Coupons</h3>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Coupon Code</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Discount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Valid Until</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Edit</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Delete</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                  No coupons available
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Coupons;