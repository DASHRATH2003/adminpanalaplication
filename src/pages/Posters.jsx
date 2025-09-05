import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Camera, Edit, Trash2 } from 'lucide-react';
import { posterService } from '../firebase/services';

const Posters = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(null);

  // Fetch posters from Firebase on component mount
  useEffect(() => {
    fetchPosters();
  }, []);

  const fetchPosters = async () => {
    try {
      setLoading(true);
      const postersData = await posterService.getAll();
      setPosters(postersData);
    } catch (error) {
      console.error('Error fetching posters:', error);
      alert('Error fetching posters. Please try again.');
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
    if (formData.title.trim()) {
      try {
        setLoading(true);
        
        if (selectedPoster) {
          // Update existing poster
          const updatedPoster = await posterService.update(selectedPoster.id, formData, imageFile);
          setPosters(prev => prev.map(poster => 
            poster.id === selectedPoster.id ? updatedPoster : poster
          ));
          alert('Poster updated successfully!');
        } else {
          // Add new poster
          const newPoster = await posterService.add(formData, imageFile);
          setPosters(prev => [newPoster, ...prev]);
          alert('Poster added successfully!');
        }
        
        handleCancel();
      } catch (error) {
        console.error('Error saving poster:', error);
        alert('Error saving poster. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', description: '', status: 'active', image: null });
    setImagePreview(null);
    setImageFile(null);
    setSelectedPoster(null);
    setIsModalOpen(false);
  };

  const handleEdit = (poster) => {
    setSelectedPoster(poster);
    setFormData({
      title: poster.title,
      description: poster.description || '',
      status: poster.status || 'active',
      image: null
    });
    setImagePreview(poster.image);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (posterId) => {
    if (window.confirm('Are you sure you want to delete this poster?')) {
      try {
        setLoading(true);
        await posterService.delete(posterId);
        setPosters(prev => prev.filter(poster => poster.id !== posterId));
        alert('Poster deleted successfully!');
      } catch (error) {
        console.error('Error deleting poster:', error);
        alert('Error deleting poster. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Posters</h2>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Add Poster</span>
          </button>
          <button 
            onClick={fetchPosters}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-white mb-4">My Posters</h3>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Poster Title</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Image</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Added Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Edit</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Delete</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    Loading posters...
                  </td>
                </tr>
              ) : posters.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    No posters available
                  </td>
                </tr>
              ) : (
                posters.map((poster) => (
                  <tr key={poster.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-6 py-4 text-white">{poster.title}</td>
                    <td className="px-6 py-4">
                      {poster.image ? (
                        <img 
                          src={poster.image} 
                          alt={poster.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                          <Camera size={20} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        poster.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {poster.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{formatDate(poster.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit(poster)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(poster.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Poster Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {selectedPoster ? 'Edit Poster' : 'Add New Poster'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Poster Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Poster Image
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                            setFormData(prev => ({ ...prev, image: null }));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-400 mb-2">Upload Poster Image</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="poster-image"
                        />
                        <label
                          htmlFor="poster-image"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                        >
                          Choose Image
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Poster Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Poster Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter poster title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter poster description"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (selectedPoster ? 'Update Poster' : 'Add Poster')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Posters;