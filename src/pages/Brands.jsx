import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Edit, Trash2 } from 'lucide-react';
import { brandService, subCategoryService } from '../firebase/services';

const Brands = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brands, setBrands] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    subCategory: ''
  });

  // Fetch data from Firebase on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [brandsData, subCategoriesData] = await Promise.all([
        brandService.getAll(),
        subCategoryService.getAll()
      ]);
      setBrands(brandsData);
      setSubCategories(subCategoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.subCategory.trim()) {
      try {
        setLoading(true);
        const newBrand = await brandService.add(formData);
        setBrands(prev => [newBrand, ...prev]);
        setFormData({ name: '', subCategory: '' });
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error adding brand:', error);
        alert('Error adding brand. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', subCategory: '' });
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        setLoading(true);
        await brandService.delete(id);
        setBrands(prev => prev.filter(brand => brand.id !== id));
      } catch (error) {
        console.error('Error deleting brand:', error);
        alert('Error deleting brand. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen ml-64">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Brands</h2>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Add Brand</span>
          </button>
          <button 
            onClick={handleRefresh}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-white mb-4">My Brands</h3>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Brands Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Sub Category</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Added Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Edit</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Delete</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    Loading brands...
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    No brands available
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id} className="border-t border-gray-700">
                    <td className="px-6 py-4 text-white">{brand.name}</td>
                    <td className="px-6 py-4 text-gray-300">{brand.subCategory}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {brand.createdAt ? new Date(brand.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-400 hover:text-blue-300 p-1">
                        <Edit size={16} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDelete(brand.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-blue-400">ADD BRAND</h3>
              <button 
                onClick={handleCancel}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Sub Category Dropdown */}
              <div className="mb-4">
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Sub Category</option>
                  {subCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.name}>{subCategory.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Brand Name */}
              <div className="mb-6">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Brand Name"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brands;