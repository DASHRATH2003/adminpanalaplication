import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Users, Mail, Phone, MapPin, Calendar, FeatherIcon, X } from 'lucide-react';

const Sellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const sellersCollection = collection(db, 'seller');
      const sellersSnapshot = await getDocs(sellersCollection);
      const sellersData = sellersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSellers(sellersData);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockSeller = async (sellerId) => {
    try {
      const sellerRef = doc(db, 'seller', sellerId);
      await updateDoc(sellerRef, {
        status: 'blocked'
      });
      
      
      // Update local state
      setSellers(prevSellers => 
        prevSellers.map(seller => 
          seller.id === sellerId 
            ? { ...seller, status: 'blocked' }
            : seller
        )
      );
      
      alert('Seller blocked successfully!');
    } catch (error) {
      console.error('Error blocking seller:', error);
      alert('Failed to block seller. Please try again.');
    }
  };

  const handleApproveSeller = async (sellerId) => {
    try {
      const sellerRef = doc(db, 'seller', sellerId);
      await updateDoc(sellerRef, {
        status: 'approved'
      });
      
      // Update local state
      setSellers(prevSellers => 
        prevSellers.map(seller => 
          seller.id === sellerId 
            ? { ...seller, status: 'approved' }
            : seller
        )
      );
      
      alert('Seller approved successfully!');
    } catch (error) {
      console.error('Error approving seller:', error);
      alert('Failed to approve seller. Please try again.');
    }
  };

  const handleViewSeller = (seller) => {
    setSelectedSeller(seller);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedSeller(null);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-gray-900 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-white">Sellers Management</h1>
        </div>
        <div className="bg-blue-600 px-4 py-2 rounded-lg">
          <span className="text-white font-semibold">Total: {sellers.length}</span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Seller Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-300">No sellers found</p>
                    <p className="text-sm text-gray-400">Sellers data will appear here when available in Firebase</p>
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-700 border-b border-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {seller.name ? seller.name.charAt(0).toUpperCase() : 'S'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {seller.name || 'Unknown Seller'}
                          </div>
                          <div className="text-sm text-gray-400">
                            ID: {seller.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {seller.email && (
                          <div className="flex items-center text-sm text-gray-300">
                            <Mail className="h-4 w-4 mr-2" />
                            {seller.email}
                          </div>
                        )}
                        {seller.phone && (
                          <div className="flex items-center text-sm text-gray-300">
                            <Phone className="h-4 w-4 mr-2" />
                            {seller.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        seller.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : seller.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : seller.status === 'approved'
                          ? 'bg-blue-100 text-blue-800'
                          : seller.status === 'blocked'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {seller.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {seller.createdAt ? new Date(seller.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-blue-400 hover:text-blue-300 mr-3"
                        onClick={() => handleViewSeller(seller)}
                      >
                        View
                      </button>
                      <button 
                        className="text-green-400 hover:text-green-300 mr-3"
                        onClick={() => handleApproveSeller(seller.id)}
                      >
                        Approve
                      </button>
                      <button 
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleBlockSeller(seller.id)}
                      >
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
      <div className="md:hidden space-y-4">
        {sellers.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-300">No sellers found</p>
            <p className="text-sm text-gray-400">Sellers data will appear here when available in Firebase</p>
          </div>
        ) : (
          sellers.map((seller) => (
            <div key={seller.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              {/* Seller Header */}
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-12 w-12">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {seller.name ? seller.name.charAt(0).toUpperCase() : 'S'}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-white">
                    {seller.name || 'Unknown Seller'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    ID: {seller.id.substring(0, 20)}...
                  </p>
                </div>
                <div className="ml-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    seller.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : seller.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : seller.status === 'approved'
                      ? 'bg-blue-100 text-blue-800'
                      : seller.status === 'blocked'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {seller.status || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {seller.email && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Mail className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="break-all">{seller.email}</span>
                  </div>
                )}
                {seller.phone && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Phone className="h-4 w-4 mr-2 text-green-400" />
                    <span>{seller.phone}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-300">
                  <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                  <span>
                    {seller.createdAt ? new Date(seller.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => handleViewSeller(seller)}
                >
                  View
                </button>
                <button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => handleApproveSeller(seller.id)}
                >
                  Approve
                </button>
                <button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => handleBlockSeller(seller.id)}
                >
                  Block
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Seller Detail Modal */}
      {showModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Seller Details</h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Business Name</label>
                      <p className="text-white font-medium">{selectedSeller.businessName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Owner Name</label>
                      <p className="text-white font-medium">{selectedSeller.ownerName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white font-medium">{selectedSeller.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Phone</label>
                      <p className="text-white font-medium">{selectedSeller.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Status & Dates</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Status</label>
                      <div className="mt-1">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          selectedSeller.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : selectedSeller.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedSeller.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedSeller.status === 'blocked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedSeller.status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Joined Date</label>
                      <p className="text-white font-medium">
                        {selectedSeller.createdAt ? new Date(selectedSeller.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Seller ID</label>
                      <p className="text-white font-medium text-xs">{selectedSeller.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {selectedSeller.address && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Address Information</h3>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-white">{selectedSeller.address}</p>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Additional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSeller.gstNumber && (
                    <div>
                      <label className="text-sm text-gray-400">GST Number</label>
                      <p className="text-white font-medium">{selectedSeller.gstNumber}</p>
                    </div>
                  )}
                  {selectedSeller.panNumber && (
                    <div>
                      <label className="text-sm text-gray-400">PAN Number</label>
                      <p className="text-white font-medium">{selectedSeller.panNumber}</p>
                    </div>
                  )}
                  {selectedSeller.bankDetails && (
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-400">Bank Details</label>
                      <div className="bg-gray-700 p-3 rounded-lg mt-1">
                        <p className="text-white text-sm">{selectedSeller.bankDetails}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-700">
                <button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  onClick={() => {
                    handleApproveSeller(selectedSeller.id);
                    closeModal();
                  }}
                >
                  Approve Seller
                </button>
                <button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  onClick={() => {
                    handleBlockSeller(selectedSeller.id);
                    closeModal();
                  }}
                >
                  Block Seller
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sellers;