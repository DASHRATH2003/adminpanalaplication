import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

const Variants = () => {
  return (
    <div className="p-4 lg:p-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Variants</h2>
        <div className="flex items-center space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus size={20} />
            <span>Add Variant</span>
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-white mb-4">My Variants</h3>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Variant Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Variant Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Added Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Edit</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Delete</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                  No variants available
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Variants;