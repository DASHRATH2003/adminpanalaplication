import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Camera, Edit, Trash2, Search } from 'lucide-react';
import { posterService, productService } from '../firebase/services';

const Posters = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductSelectModalOpen, setIsProductSelectModalOpen] = useState(false);
  const [isProductFormModalOpen, setIsProductFormModalOpen] = useState(false);
  const [posters, setPosters] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active',
    image: null
  });
  const [productFormData, setProductFormData] = useState({
    bannerId: '',
    bannerName: '',
    productId: '',
    price: '',
    offerPrice: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [productImageFile, setProductImageFile] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch posters and products from Firebase on component mount
  useEffect(() => {
    fetchPosters();
    fetchProducts();
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

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

  const fetchProducts = async () => {
    try {
      const productsData = await productService.getAll();
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Error fetching products. Please try again.');
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

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductFormData({
      bannerId: '',
      bannerName: '',
      productId: product.id,
      price: product.price.toString(),
      offerPrice: product.offerPrice ? product.offerPrice.toString() : '',
      image: null
    });
    setProductImagePreview(null);
    setProductImageFile(null);
    setIsProductSelectModalOpen(false);
    setIsProductFormModalOpen(true);
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setProductImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProductFormSubmit = async (e) => {
    e.preventDefault();
    if (productFormData.bannerName.trim() && productFormData.productId.trim() && productFormData.price.trim()) {
      try {
        setLoading(true);
        
        // Create banner data
        const bannerData = {
          bannerName: productFormData.bannerName,
          productId: productFormData.productId,
          price: productFormData.price,
          offerPrice: productFormData.offerPrice || '',
          status: 'active'
        };
        
        const newBanner = await posterService.add(bannerData, productImageFile);
        setPosters(prev => [newBanner, ...prev]);
        
        // Update original product if price or offer price changed
        if (selectedProduct) {
          const originalPrice = selectedProduct.price.toString();
          const originalOfferPrice = selectedProduct.offerPrice ? selectedProduct.offerPrice.toString() : '';
          
          if (productFormData.price !== originalPrice || productFormData.offerPrice !== originalOfferPrice) {
            try {
              const updatedProductData = {
                ...selectedProduct,
                price: parseFloat(productFormData.price),
                offerPrice: productFormData.offerPrice ? parseFloat(productFormData.offerPrice) : 0
              };
              
              await productService.update(selectedProduct.id, updatedProductData);
              
              // Update local products state
              setProducts(prev => prev.map(product => 
                product.id === selectedProduct.id 
                  ? { ...product, price: parseFloat(productFormData.price), offerPrice: productFormData.offerPrice ? parseFloat(productFormData.offerPrice) : 0 }
                  : product
              ));
              
              console.log('Product price updated successfully');
            } catch (error) {
              console.error('Error updating product price:', error);
              // Don't show error to user as banner was created successfully
            }
          }
        }
        
        // Reset form
        setProductFormData({
          bannerId: '',
          bannerName: '',
          productId: '',
          price: '',
          offerPrice: '',
          image: null
        });
        setProductImagePreview(null);
        setProductImageFile(null);
        setSelectedProduct(null);
        setIsProductFormModalOpen(false);
        
        alert('Banner created successfully!');
      } catch (error) {
        console.error('Error creating banner:', error);
        alert('Error creating banner. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProductFormCancel = () => {
    setProductFormData({
      bannerId: '',
      bannerName: '',
      productId: '',
      price: '',
      offerPrice: '',
      image: null
    });
    setProductImagePreview(null);
    setProductImageFile(null);
    setSelectedProduct(null);
    setIsProductFormModalOpen(false);
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
    <div className="p-4 lg:p-6 bg-gray-900 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Posters</h2>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsProductSelectModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Add Banner</span>
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

      {/* Product Selection Modal */}
      {isProductSelectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Select Product for Poster
                </h3>
                <button
                  onClick={() => setIsProductSelectModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Box */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products by name, category, or brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full text-center text-gray-400 py-8">
                    {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-blue-500 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {product.image || product.images?.[0] ? (
                          <img
                            src={product.image || product.images?.[0]}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Camera size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{product.name}</h4>
                          <p className="text-gray-400 text-xs">{product.category}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-green-400 font-medium text-sm">₹{product.price}</span>
                            {product.offerPrice && (
                              <span className="text-orange-400 text-xs">₹{product.offerPrice}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsProductSelectModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {isProductFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Create Banner
                </h3>
                <button
                  onClick={handleProductFormCancel}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleProductFormSubmit} className="space-y-4">
                {/* Banner Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Banner Image
                  </label>
                  <div className="flex items-center justify-center w-full">
                    {productImagePreview ? (
                      <div className="relative">
                        <img
                          src={productImagePreview}
                          alt="Banner preview"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <label
                          htmlFor="productImageUpload"
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <Camera className="w-6 h-6 text-white" />
                        </label>
                        <input
                          id="productImageUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageChange}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="w-full">
                        <input
                          id="productImageUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="productImageUpload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600"
                        >
                          <Camera className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">Choose Banner Image</p>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner ID - Hidden (Auto Generated) */}

                {/* Banner Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Banner Name *
                  </label>
                  <input
                    type="text"
                    name="bannerName"
                    value={productFormData.bannerName || ''}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter banner name"
                    required
                  />
                </div>

                {/* Product ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product ID *
                  </label>
                  <input
                    type="text"
                    name="productId"
                    value={productFormData.productId}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Product ID"
                    readOnly
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={productFormData.price}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter price"
                    required
                  />
                </div>

                {/* Offer Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Offer Price
                  </label>
                  <input
                    type="number"
                    name="offerPrice"
                    value={productFormData.offerPrice}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter offer price (optional)"
                  />
                </div>



                {/* Form Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleProductFormCancel}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Banner'}
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