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
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-green-400" />
          <h1 className="text-2xl font-bold text-white">Customers Management</h1>
        </div>
        <div className="bg-gray-700 px-4 py-2 rounded-lg">
          <span className="text-gray-200 font-semibold">Total: {customers.length}</span>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden max-w-6xl">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '25%'}}>
                  Customer Info
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '25%'}}>
                  Contact
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '12%'}}>
                  Status
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '12%'}}>
                  Orders
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '13%'}}>
                  Joined Date
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" style={{width: '13%'}}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-600">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-2 py-4 text-center text-gray-400">
                    <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-lg font-medium text-gray-300">No customers found</p>
                    <p className="text-sm text-gray-400">Customer data will appear here when available in Firebase</p>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-700">
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-2">
                          <div className="text-xs font-medium text-white">
                            {customer.name || 'Unknown Customer'}
                          </div>
                          <div className="text-xs text-gray-300">
                            ID: {customer.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center text-xs text-gray-300">
                            <Mail className="h-3 w-3 mr-1" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-xs text-gray-300">
                            <Phone className="h-3 w-3 mr-1" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center text-xs text-gray-300">
                            <MapPin className="h-3 w-3 mr-1" />
                            {customer.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1 py-1 text-xs font-semibold rounded-full ${
                        customer.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : customer.status === 'inactive'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center text-xs text-gray-300">
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        {customer.totalOrders || 0} orders
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-300">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {customer.createdAt ? new Date(customer.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium">
                      <button className="text-blue-400 hover:text-blue-300 mr-2">
                        View
                      </button>
                      <button className="text-green-400 hover:text-green-300 mr-2">
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
    </div>
  );
};

export default Customers;