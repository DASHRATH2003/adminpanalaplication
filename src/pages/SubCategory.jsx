import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Edit, Trash2 } from 'lucide-react';
import { subCategoryService, categoryService } from '../firebase/services';

const SubCategory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    date: new Date().toISOString().split('T')[0] // Default to today's date
  });

  // Fetch data from Firebase on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [subCategoriesData, categoriesData] = await Promise.all([
        subCategoryService.getAll(),
        categoryService.getAll()
      ]);
      setSubCategories(subCategoriesData);
      setCategories(categoriesData);
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
    if (formData.name.trim() && formData.category.trim()) {
      try {
        setLoading(true);
        const newSubCategory = await subCategoryService.add(formData);
        setSubCategories(prev => [newSubCategory, ...prev]);
        setFormData({ name: '', category: '', date: new Date().toISOString().split('T')[0] });
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error adding sub category:', error);
        alert('Error adding sub category. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', category: '', date: new Date().toISOString().split('T')[0] });
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sub category?')) {
      try {
        setLoading(true);
        await subCategoryService.delete(id);
        setSubCategories(prev => prev.filter(subCat => subCat.id !== id));
      } catch (error) {
        console.error('Error deleting sub category:', error);
        alert('Error deleting sub category. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Sub Category</h2>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Add Sub Category</span>
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
        <h3 className="text-lg font-medium text-white mb-4">My Sub Categories</h3>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">SubCategory Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Category</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Added Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Edit</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Delete</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    Loading sub categories...
                  </td>
                </tr>
              ) : subCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    No sub categories available
                  </td>
                </tr>
              ) : (
                subCategories.map((subCategory) => (
                  <tr key={subCategory.id} className="border-t border-gray-700">
                    <td className="px-6 py-4 text-white">{subCategory.name}</td>
                    <td className="px-6 py-4 text-gray-300">{subCategory.category}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {subCategory.date ? new Date(subCategory.date).toLocaleDateString() : (subCategory.createdAt ? new Date(subCategory.createdAt.seconds * 1000).toLocaleDateString() : 'N/A')}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-400 hover:text-blue-300 p-1">
                        <Edit size={16} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDelete(subCategory.id)}
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

      {/* Add Sub Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-blue-400">ADD SUB CATEGORY</h3>
              <button 
                onClick={handleCancel}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Category Dropdown */}
              <div className="mb-4">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Sub Category Name */}
              <div className="mb-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Sub category name"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {/* Date */}
              <div className="mb-6">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

export default SubCategory;