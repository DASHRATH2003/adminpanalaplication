import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Camera, Edit, Trash2 } from 'lucide-react';
import { categoryService } from '../firebase/services';

const Category = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Fetch categories from Firebase on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await categoryService.getAll();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      try {
        setLoading(true);
        
        if (selectedCategory) {
          // Update existing category
          console.log('Selected category object:', selectedCategory);
          console.log('Updating category with ID:', selectedCategory.id);
          console.log('Form data:', formData);
          console.log('Image file:', imageFile);
          const updatedCategory = await categoryService.update(selectedCategory.id, formData, imageFile);
          console.log('Updated category received:', updatedCategory);
          setCategories(prev => prev.map(cat => 
            cat.id === selectedCategory.id ? updatedCategory : cat
          ));
        } else {
          // Add new category
          const newCategory = await categoryService.add(formData, imageFile);
          setCategories(prev => [newCategory, ...prev]);
        }
        
        setFormData({ name: '', image: null });
        setImagePreview(null);
        setImageFile(null);
        setSelectedCategory(null);
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error saving category:', error);
        alert('Error saving category. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', image: null });
    setImagePreview(null);
    setImageFile(null);
    setSelectedCategory(null);
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        setLoading(true);
        console.log('Deleting category with ID:', id);
        
        // Delete from Firebase
        await categoryService.delete(id);
        console.log('Category deleted successfully from Firebase');
        
        // Update local state immediately
        setCategories(prev => {
          const updatedCategories = prev.filter(cat => cat.id !== id);
          console.log('Updated categories list:', updatedCategories.length, 'categories remaining');
          return updatedCategories;
        });
        
        // Show success message
        alert('Category deleted successfully!');
        
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(`Error deleting category: ${error.message}. Please try again.`);
        
        // Refresh data in case of error to show current state
        fetchCategories();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      image: category.image
    });
    setImagePreview(category.image);
    setIsModalOpen(true);
  };

  const handleRefresh = () => {
    fetchCategories();
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-900 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Category</h2>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Add Category</span>
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
        <h3 className="text-lg font-medium text-white mb-4">My Categories</h3>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Edit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Delete</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-400">Loading categories...</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-400">No categories found</td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img src={category.image} alt={category.name} className="h-10 w-10 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-indigo-400 hover:text-indigo-300 mr-4"
                      >
                        Edit
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedCategory ? 'Edit Category' : 'Add New Category'}</h3>
                <p className="text-sm text-gray-400 mt-1">{selectedCategory ? 'Update the details below to edit the category' : 'Fill in the details below to create a new category'}</p>
              </div>
              <button 
                onClick={handleCancel}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Category Image
                </label>
                <div className="flex justify-center">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload"
                      className="w-32 h-32 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-600 hover:border-gray-500 transition-all duration-200"
                    >
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Camera size={32} className="text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-400 font-medium">Upload Image</span>
                          <span className="text-xs text-gray-500 block mt-1">Click to browse</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Category Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              

              
              {/* Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all duration-200 font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (selectedCategory ? 'Updating...' : 'Adding...') : (selectedCategory ? 'Update Category' : 'Add Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;