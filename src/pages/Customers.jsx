import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Users, Mail, Phone, MapPin, Calendar, ShoppingBag } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const customersCollection = collection(db, 'customers');
      const customersSnapshot = await getDocs(customersCollection);
      const customersData = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 md:h-8 md:w-8 text-green-400" />
          <h1 className="text-xl md:text-2xl font-bold text-white">Customers Management</h1>
        </div>
        <div className="bg-gray-700 px-3 md:px-4 py-2 rounded-lg">
          <span className="text-gray-200 font-semibold text-sm md:text-base">Total: {customers.length}</span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '25%'}}>
                  Customer Info
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '25%'}}>
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '12%'}}>
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '12%'}}>
                  Orders
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '13%'}}>
                  Joined Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '13%'}}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-600">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                    <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-lg font-medium text-gray-300">No customers found</p>
                    <p className="text-sm text-gray-400">Customer data will appear here when available in Firebase</p>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">
                            {customer.name || 'Unknown Customer'}
                          </div>
                          <div className="text-xs text-gray-300">
                            ID: {customer.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-300">
                            <Mail className="h-4 w-4 mr-2" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-300">
                            <Phone className="h-4 w-4 mr-2" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center text-sm text-gray-300">
                            <MapPin className="h-4 w-4 mr-2" />
                            {customer.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : customer.status === 'inactive'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-300">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        {customer.totalOrders || 0} orders
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {customer.createdAt ? new Date(customer.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-400 hover:text-blue-300 mr-3">
                        View
                      </button>
                      <button className="text-green-400 hover:text-green-300 mr-3">
                        Message
                      </button>
                      <button className="text-red-400 hover:text-red-300">
                        Block
                      </button>
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
        {customers.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <p className="text-lg font-medium text-gray-300">No customers found</p>
            <p className="text-sm text-gray-400">Customer data will appear here when available in Firebase</p>
          </div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="bg-gray-800 rounded-lg p-4 shadow-md">
              {/* Customer Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {customer.name || 'Unknown Customer'}
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: {customer.id}
                    </div>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  customer.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : customer.status === 'inactive'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {customer.status || 'Active'}
                </span>
              </div>

              {/* Customer Details */}
              <div className="space-y-2 mb-4">
                {customer.email && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="break-all">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {customer.phone}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center text-sm text-gray-300">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="break-words">{customer.address}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-300">
                  <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
                  {customer.totalOrders || 0} orders
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {customer.createdAt ? new Date(customer.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                  View
                </button>
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                  Message
                </button>
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                  Block
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Customers;