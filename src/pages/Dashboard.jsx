import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, MoreVertical, Package, AlertTriangle, Clock, Archive, Truck, CheckCircle, X, Camera, Edit, Trash2, Upload } from 'lucide-react';
import { productService, categoryService, subCategoryService } from '../firebase/services';
import { testFirebaseConnection } from '../firebase/test';
import BulkUpload from '../components/BulkUpload';
import { bulkUploadProducts } from '../firebase/bulkUploadService';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductSelectModalOpen, setIsProductSelectModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    image: null,
    description: '',
    price: '',
    brand: '',
    category: '',
    subCategory: '',
    attributes: {},
    stock: '',
    sku: '',
    offerPrice: '',
    cashOnDelivery: 'no'
  });
  const [categoryImagePreview, setCategoryImagePreview] = useState([]);
  const [categoryImageFiles, setCategoryImageFiles] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAttributeDropdown, setShowAttributeDropdown] = useState(false);
  
  // Category-specific attributes mapping
  const categoryAttributes = {
    "Clothing": ["Size", "Color", "Material", "Fit", "Pattern", "Sleeve Type", "Care Instruction (Machine wash, Hand wash)"],
    "FootWear": ["Size", "Color", "Material", "Type", "Gender"],
    "Footwares": ["Size", "Color", "Material", "Type", "Gender"],
    "Mobile": ["Model", "Color", "Ram", "Storage", "Battery", "Camera", "Processor", "Display", "OS", "Connectivity", "Warranty"],
    "Laptops": ["Model", "Graphics (Integrated / Dedicated)", "Ram", "Storage", "Battery", "Camera", "Processor", "Display", "OS", "Connectivity", "Warranty", "Screen Size", "Operating System", "Port", "Weight", "Warranty"],
    "Electronics": ["Model", "Screen Size", "Resolution (2K, 4K, 8K)", "Display Type", "Smart Features (Yes, No)", "Connectivity (USB, WiFi, Bluetooth, HDMI)", "Energy Rating", "Power Consumption", "Warranty"],
    "TV": ["Model", "Screen Size", "Resolution (2K, 4K, 8K)", "Display Type", "Smart Features (Yes, No)", "Connectivity (USB, WiFi, Bluetooth, HDMI)", "Energy Rating", "Power Consumption", "Warranty"],
    "Toys": ["Age Group", "Material", "Color", "Size", "Safety Certification", "Battery Required", "Educational Value", "Brand", "Weight", "Warranty"],
    "Fashion": ["Size", "Color", "Material", "Fit", "Pattern", "Style", "Occasion", "Care Instructions", "Brand", "Season"],
    "Cosmetic": ["Shade", "Color", "Type", "Ingredients", "Skin Type", "Volume/Weight", "Expiry Date", "Cruelty Free", "Organic", "Brand"],
    "Cousmetic": ["Shade", "Color", "Type", "Ingredients", "Skin Type", "Volume/Weight", "Expiry Date", "Cruelty Free", "Organic", "Brand"],
    "Cosmetics": ["Shade", "Color", "Type", "Ingredients", "Skin Type", "Volume/Weight", "Expiry Date", "Cruelty Free", "Organic", "Brand"],
    "Shoe": ["Size", "Color", "Material", "Type", "Gender", "Sole Material", "Heel Height", "Closure Type", "Brand", "Occasion"],
    "Furniture": ["Material", "Color", "Dimension (L x W x H)", "Weight Capacity", "Assembly (Yes, No)", "Style", "Room Type (Bedroom, Living Room)", "Warranty"],
    "Grossery": ["Weight/Volume", "Quantity (1 Pack, 2 Pack)", "Organic/Non Organic", "Expiry Date", "Storage Instructions", "Dietary Preference (Vegan, Gluten-Free, Keto-Friendly)",],
    "Beauty & Personal Care": ["Shade", "Color", "Type (Cream, Serum, Powder, Oil, Shampoo, etc.)", "Ingredients (Natural, Chemical, Herbal)", "Skin/Hair Type (Oily, Dry, Sensitive, All Types)", "Weight/Volume", "Expiry Date", "Dermatologically Tested (Yes/No)"],
    "Beauty&Personal Care": ["Shade", "Color", "Type (Cream, Serum, Powder, Oil, Shampoo, etc.)", "Ingredients (Natural, Chemical, Herbal)", "Skin/Hair Type (Oily, Dry, Sensitive, All Types)", "Weight/Volume", "Expiry Date", "Dermatologically Tested (Yes/No)"],
    "Beauty&PersonalCare": ["Shade", "Color", "Type (Cream, Serum, Powder, Oil, Shampoo, etc.)", "Ingredients (Natural, Chemical, Herbal)", "Skin/Hair Type (Oily, Dry, Sensitive, All Types)", "Weight/Volume", "Expiry Date", "Dermatologically Tested (Yes/No)"],
    "Beauty&personalcare": ["Shade", "Color", "Type (Cream, Serum, Powder, Oil, Shampoo, etc.)", "Ingredients (Natural, Chemical, Herbal)", "Skin/Hair Type (Oily, Dry, Sensitive, All Types)", "Weight/Volume", "Expiry Date", "Dermatologically Tested (Yes/No)"],
    "Jewellery": ["Material (Gold, Silver, Platinum, Artificial, Diamond)", "Purity (18k, 22k, 24kt)", "Weight", "Color", "Size (Ring Size, Chain Length, etc.)", "Gemstone (Diamond, Ruby, Emerald, etc.)", "Certification (BIS Hallmark, IGI, GIA, etc.)", "Occasion (Daily, Wedding, Party)"],
    "Book": ["Title", "Author", "Publisher", "Edition", "Language", "ISBN", "Pages", "Binding (Paperback, Hardcover)", "Genre (Fiction, Non-Fiction, Academic, etc.)"],
    "Books": ["Title", "Author", "Publisher", "Edition", "Language", "ISBN", "Pages", "Binding (Paperback, Hardcover)", "Genre (Fiction, Non-Fiction, Academic, etc.)"],
    "Stationery": ["Title", "Author", "Publisher", "Edition", "Language", "ISBN", "Pages", "Binding (Paperback, Hardcover)", "Genre (Fiction, Non-Fiction, Academic, etc.)"],
    "Beauty": ["Shade", "Color", "Type (Cream, Serum,Powder, Oil, Shampoo, etc.)", "Ingredients (Natural, Chemical, Herbal)", "Skin/Hair Type (Oily, Dry, Sensitive, All Type)", "Vegan/Volume", "Expiry Date", "Dermatologically Tested (Yes/No)"],
    "Jewelry": ["Material (Gold, Silver, Platinum, Artificial, Diamond)", "Purity (8k, 22k, 24kt)", "Weight", "Color", "Stone (Fine Size, Chain Length, etc.)", "Gemstone (Diamond, Ruby, Emerald, etc.)", "Certification (BIS Hallmark, IGI, GIA, etc.)", "Occasion (Daily, Wedding, Party)"],
    "Grocery": ["Weight/Volume", "Quantity (1 Pack, 2 Pack)", "Organic/Non Organic", "Expiry Date", "Storage Instructions", "Dietary Preference (Vegan, Gluten-Free, etc.)", "Nutritional Info", "Brand", "Category", "Subcategory", "Price", "Offer Price", "SKU", "Stock", "Description", "Images", "Cash on Delivery"],
    "Home Decor": ["Material", "Color", "Dimension (L x W x H)", "Weight Capacity", "Assembly (Yes, No)", "Style", "Room Type (Bedroom, Living Room)", "Warranty"]
  };
  
  // Default attributes list for fallback
  const predefinedAttributes = [
    ...Object.values(categoryAttributes).flat()
  ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subCategory: '',
    price: '',
    image: null,
    attribute: '',
    description: '',
    brand: '',
    stock: '',
    sku: '',
    offerPrice: '',
    cashOnDelivery: 'no'
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Fetch data from Firebase on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Close attribute dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAttributeDropdown && !event.target.closest('.attribute-dropdown-container')) {
        setShowAttributeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttributeDropdown]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data from Firebase...');
      
      const [productsData, categoriesData, subCategoriesData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        subCategoryService.getAll()
      ]);
      
      console.log('Products data:', productsData);
      console.log('Categories data:', categoriesData);
      console.log('SubCategories data:', subCategoriesData);
      
      // Check individual product structure
      if (productsData.length > 0) {
        console.log('First product structure:', productsData[0]);
        console.log('Product keys:', Object.keys(productsData[0]));
        console.log('Product categoryId:', productsData[0].categoryId);
        console.log('Product subCategoryId:', productsData[0].subCategoryId);
        console.log('Product category field:', productsData[0].category);
        console.log('Product subCategory field:', productsData[0].subCategory);
      }
      
      if (categoriesData.length > 0) {
        console.log('First category structure:', categoriesData[0]);
        console.log('Category keys:', Object.keys(categoriesData[0]));
      }
      
      if (subCategoriesData.length > 0) {
        console.log('First subcategory structure:', subCategoriesData[0]);
        console.log('Subcategory keys:', Object.keys(subCategoriesData[0]));
      }
      
      // Map category and subcategory IDs to names in products
      const productsWithNames = productsData.map(product => {
        let categoryName = 'No Category';
        let subCategoryName = 'No SubCategory';
        
        // Check if product already has category name
        if (product.category && typeof product.category === 'string') {
          categoryName = product.category;
        } else if (product.categoryId) {
          // Find category by ID
          const category = categoriesData.find(cat => cat.id === product.categoryId);
          categoryName = category ? (category.name || category.categoryName || 'Unknown Category') : 'Category Not Found';
        } else if (product.categoryName) {
          categoryName = product.categoryName;
        }
        
        // Check if product already has subcategory name
        if (product.subCategory && typeof product.subCategory === 'string') {
          subCategoryName = product.subCategory;
        } else if (product.subCategoryId) {
          // Find subcategory by ID
          const subCategory = subCategoriesData.find(subCat => subCat.id === product.subCategoryId);
          subCategoryName = subCategory ? (subCategory.name || subCategory.subCategoryName || 'Unknown SubCategory') : 'SubCategory Not Found';
        } else if (product.subCategoryName) {
          subCategoryName = product.subCategoryName;
        }
        
        return {
          ...product,
          category: categoryName,
          subCategory: subCategoryName
        };
      });
      
      console.log('Products with mapped names:', productsWithNames);
      
      setProducts(productsWithNames);
      setCategories(categoriesData);
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
    
    // No auto-fill for attributes when category changes as per user request
    if (name === 'category') {
      setFormData(prev => ({
        ...prev,
        attribute: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.category.trim() && formData.subCategory.trim() && formData.price.trim()) {
      try {
        setLoading(true);
        
        if (selectedProduct) {
          // Update existing product
          const updatedProduct = await productService.update(selectedProduct.id, formData, imageFile);
          setProducts(prev => prev.map(p => p.id === selectedProduct.id ? updatedProduct : p));
        } else {
          // Add new product
          const newProduct = await productService.add(formData, imageFile);
          
          // Map category and subcategory names for the new product
          let categoryName = formData.category;
          let subCategoryName = formData.subCategory;
          
          // If formData contains IDs, find the actual names
          if (formData.categoryId) {
            const category = categories.find(cat => cat.id === formData.categoryId);
            categoryName = category ? (category.name || category.categoryName || formData.category) : formData.category;
          }
          
          if (formData.subCategoryId) {
            const subCategory = subCategories.find(subCat => subCat.id === formData.subCategoryId);
            subCategoryName = subCategory ? (subCategory.name || subCategory.subCategoryName || formData.subCategory) : formData.subCategory;
          }
          
          // Create properly mapped product
          const mappedNewProduct = {
            ...newProduct,
            category: categoryName,
            subCategory: subCategoryName
          };
          
          setProducts(prev => [mappedNewProduct, ...prev]);
        }
        
        setFormData({ 
          name: '', 
          category: '', 
          subCategory: '', 
          price: '', 
          image: null, 
          attribute: '',
          description: '',
          brand: '',
          stock: '',
          sku: '',
          offerPrice: '',
          cashOnDelivery: 'no'
        });
        setImagePreview(null);
        setImageFile(null);
        setSelectedProduct(null);
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ 
      name: '', 
      category: '', 
      subCategory: '', 
      price: '', 
      image: null, 
      attribute: '',
      description: '',
      brand: '',
      stock: '',
      sku: '',
      offerPrice: '',
      cashOnDelivery: 'no'
    });
    setImagePreview(null);
    setImageFile(null);
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  const handleBulkUpload = async (productsData) => {
    try {
      setLoading(true);
      
      const results = await bulkUploadProducts(
        productsData,
        (progress, uploaded, total) => {
          console.log(`Upload progress: ${progress}% (${uploaded}/${total})`);
        }
      );
      
      console.log('Upload completed:', results);
      
      if (results.success && results.success.length > 0) {
        // Refresh products list to show newly uploaded products
        await fetchAllData();
        
        // Show success message
        alert(`Successfully uploaded ${results.success.length} products!${results.errors && results.errors.length > 0 ? ` ${results.errors.length} products failed.` : ''}`);
      }
      
      if (results.errors && results.errors.length > 0) {
        console.error('Upload errors:', results.errors);
      }
      
    } catch (error) {
      console.error('Bulk upload failed:', error);
      alert(`Bulk upload failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to count products per category
  const getProductCountByCategory = (categoryName) => {
    return products.filter(product => product.category === categoryName).length;
  };

  // Category form handlers
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle dynamic attribute fields
    if (name.startsWith('attribute_')) {
      // Get the attribute name from the field name
      const attributeName = name.replace('attribute_', '').replace(/_/g, ' ');
      
      // Update the categoryFormData with the new attribute value
      setCategoryFormData(prev => {
        const currentAttributes = prev.attributes || {};
        const updatedAttributes = {
          ...currentAttributes,
          [attributeName]: value
        };
        
        return {
          ...prev,
          attributes: updatedAttributes
        };
      });
    } else {
      // Handle regular form fields
      setCategoryFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear attributes when category changes
      if (name === 'category') {
        setCategoryFormData(prev => ({
          ...prev,
          attributes: {}
        }));
      }
    }
  };

  const handleAttributeSelect = (attribute) => {
    // Only add attribute if it belongs to the selected category
    if (isAttributeValidForCategory(attribute, categoryFormData.category)) {
      const currentAttributes = categoryFormData.attribute;
      const newAttribute = currentAttributes ? `${currentAttributes}, ${attribute}` : attribute;
      setCategoryFormData(prev => ({
        ...prev,
        attribute: newAttribute
      }));
    } else {
      alert(`The attribute "${attribute}" is not valid for the selected category "${categoryFormData.category}". Please select a valid attribute.`);
    }
    setShowAttributeDropdown(false);
  };

  // Attribute input click handler removed as per user request
  const handleAttributeInputClick = () => {
    // No dropdown functionality as per user request
  };
  
  // Get attributes based on selected category
  const getCategorySpecificAttributes = (categoryName) => {
    if (categoryName && categoryAttributes[categoryName]) {
      return categoryAttributes[categoryName];
    }
    return predefinedAttributes; // Fallback to all attributes if category not found
  };
  
  // Validate if attribute belongs to selected category
  const isAttributeValidForCategory = (attribute, categoryName) => {
    if (!categoryName || !attribute) return true; // If no category or attribute selected, consider valid
    
    const validAttributes = categoryAttributes[categoryName] || [];
    
    // Handle comma-separated attributes
    if (attribute.includes(',')) {
      const attributeList = attribute.split(',').map(attr => attr.trim());
      return attributeList.every(attr => validAttributes.includes(attr));
    }
    
    return validAttributes.includes(attribute);
  };

  const handleCategoryImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setCategoryImageFiles(prev => [...prev, ...files]);
      setCategoryFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...files]
      }));
      
      // Generate previews for new files
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCategoryImagePreview(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    setCategoryImageFiles(prev => prev.filter((_, i) => i !== index));
    setCategoryImagePreview(prev => prev.filter((_, i) => i !== index));
    setCategoryFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (categoryFormData.name.trim()) {
      try {
        setLoading(true);
        
        // Create product data object with all fields
        const productData = {
          name: categoryFormData.name,
          description: categoryFormData.description,
          price: parseFloat(categoryFormData.price) || 0,
          offerPrice: parseFloat(categoryFormData.offerPrice) || 0,
          brand: categoryFormData.brand,
          category: categoryFormData.category,
          subCategory: categoryFormData.subCategory,
          attributes: categoryFormData.attributes || {},
          stock: parseInt(categoryFormData.stock) || 0,
          sku: categoryFormData.sku,
          cashOnDelivery: categoryFormData.cashOnDelivery,
          date: new Date().toISOString().split('T')[0]
        };
        
        const newProduct = await productService.add(productData, categoryImageFiles);
        setProducts(prev => [newProduct, ...prev]);
        setCategoryFormData({ 
          name: '', 
          images: [],
          description: '',
          price: '',
          brand: '',
          category: '',
          subCategory: '',
          attribute: '',
          attributes: {},
          stock: '',
          sku: '',
          offerPrice: '',
          cashOnDelivery: 'no'
        });
        setCategoryImagePreview([]);
        setCategoryImageFiles([]);
        setIsAddCategoryModalOpen(false);
        alert('Product added successfully!');
      } catch (error) {
        console.error('Error adding product:', error);
        alert('Error adding product. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCategoryCancel = () => {
    setCategoryFormData({ 
      name: '', 
      images: [],
      description: '',
      price: '',
      brand: '',
      category: '',
      subCategory: '',
      attributes: {},
      stock: '',
      sku: '',
      offerPrice: '',
      cashOnDelivery: 'no'
    });
    setCategoryImagePreview([]);
    setCategoryImageFiles([]);
    setIsAddCategoryModalOpen(false);
  };

  const handleCategoryClick = (selectedCategory = null) => {
    if (selectedCategory) {
      // Pre-fill category when clicking on existing category
      setCategoryFormData(prev => ({
        ...prev,
        category: selectedCategory.name
      }));
    }
    setIsAddCategoryModalOpen(true);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      subCategory: product.subCategory,
      price: product.price,
      image: product.image,
      attribute: product.attribute || ''
    });
    setImagePreview(product.image);
    setIsProductSelectModalOpen(false);
    setIsModalOpen(true);
  };

  const handleProductSelectCancel = () => {
    setIsProductSelectModalOpen(false);
    setSelectedProduct(null);
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setFormData({ 
      name: '', 
      category: '', 
      subCategory: '', 
      price: '', 
      image: null, 
      attribute: '',
      description: '',
      brand: '',
      stock: '',
      sku: '',
      offerPrice: '',
      cashOnDelivery: 'no'
    });
    setImagePreview(null);
    setImageFile(null);
    setIsProductSelectModalOpen(false);
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      subCategory: product.subCategory,
      price: product.price,
      image: product.image,
      attribute: product.attribute || '',
      description: product.description || '',
      brand: product.brand || '',
      stock: product.stock || '',
      sku: product.sku || '',
      offerPrice: product.offerPrice || '',
      cashOnDelivery: product.cashOnDelivery || 'no'
    });
    setImagePreview(product.image);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setLoading(true);
        console.log('Deleting product with ID:', id);
        
        // Delete from Firebase
        await productService.delete(id);
        console.log('Product deleted successfully from Firebase');
        
        // Update local state immediately
        setProducts(prev => {
          const updatedProducts = prev.filter(product => product.id !== id);
          console.log('Updated products list:', updatedProducts.length, 'products remaining');
          return updatedProducts;
        });
        
        // Show success message
        alert('Product deleted successfully!');
        
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(`Error deleting product: ${error.message}. Please try again.`);
        
        // Refresh data in case of error to show current state
        fetchAllData();
      } finally {
        setLoading(false);
      }
    }
  };

  const productStats = [
    {
      title: 'All Products',
      count: `${products.length} Product${products.length !== 1 ? 's' : ''}`,
      icon: Package,
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100'
    },
    {
      title: 'Out of Stock',
      count: '0 Product',
      icon: AlertTriangle,
      color: 'bg-red-500',
      iconBg: 'bg-red-100'
    },
    {
      title: 'Limited Stock',
      count: '0 Product',
      icon: Clock,
      color: 'bg-yellow-500',
      iconBg: 'bg-yellow-100'
    },
    {
      title: 'Other Stock',
      count: '0 Product',
      icon: Archive,
      color: 'bg-green-500',
      iconBg: 'bg-green-100'
    }
  ];

  const orderStats = [
    { label: 'All Orders', count: '0 Order', color: 'text-purple-600' },
    { label: 'Pending Orders', count: '0 Order', color: 'text-yellow-600' },
    { label: 'Processed Orders', count: '0 Order', color: 'text-blue-600' },
    { label: 'Cancelled Orders', count: '0 Order', color: 'text-red-600' },
    { label: 'Shipped Orders', count: '0 Order', color: 'text-indigo-600' },
    { label: 'Delivered Orders', count: '0 Order', color: 'text-green-600' }
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-900 min-h-screen flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8">
      {/* Main Content - Products Section */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 gap-3 lg:gap-4">
          <h2 className="text-xl md:text-2xl font-semibold text-white">My Products</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
            <button 
              onClick={() => setIsProductSelectModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm md:text-base"
            >
              <Plus size={18} className="md:w-5 md:h-5" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button 
              onClick={() => setIsBulkUploadModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm md:text-base"
            >
              <Upload size={18} className="md:w-5 md:h-5" />
              <span className="hidden sm:inline">Bulk Upload</span>
              <span className="sm:hidden">Bulk</span>
            </button>
            <button 
              onClick={fetchAllData}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Product Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {productStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gray-800 rounded-lg p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                    <Icon size={24} className={stat.color.replace('bg-', 'text-')} />
                  </div>
                  <button className="text-gray-400 hover:text-white">
                    <MoreVertical size={20} />
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{stat.title}</h3>
                <p className="text-gray-400">{stat.count}</p>
              </div>
            );
          })}
        </div>

        {/* Products Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="overflow-auto flex-1">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-300">Product Name</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-300 hidden sm:table-cell">Category</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-300 hidden md:table-cell">Sub Category</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-300">Price</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-3 md:px-6 py-8 md:py-12 text-center text-gray-400 text-sm">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-3 md:px-6 py-8 md:py-12 text-center text-gray-400 text-sm">
                      No products available
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-t border-gray-700">
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package size={14} className="text-gray-400 md:w-4 md:h-4" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-white text-sm md:text-base block leading-tight break-words">{product.name}</span>
                            <div className="sm:hidden text-xs text-gray-400 mt-1">
                              {product.category} • ₹{product.price}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-gray-300 text-sm hidden sm:table-cell">{product.category}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-gray-300 text-sm hidden md:table-cell">{product.subCategory}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-gray-300 text-sm hidden sm:block sm:table-cell">₹{product.price}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            disabled={loading}
                          >
                            <Edit size={14} className="md:w-4 md:h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            disabled={loading}
                          >
                            <Trash2 size={14} className="md:w-4 md:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Orders Details */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-gray-800 rounded-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-white">Orders Details</h2>
          <div className="text-2xl md:text-3xl font-bold text-white">0</div>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
          {orderStats.map((stat, index) => {
            const icons = [Package, Clock, Truck, AlertTriangle, Truck, CheckCircle];
            const Icon = icons[index];
            return (
              <div key={index} className="bg-gray-700 rounded-lg p-3 md:p-4 flex items-center space-x-3">
                <div className="p-2 bg-gray-600 rounded-lg flex-shrink-0">
                  <Icon size={16} className={`${stat.color} md:w-[18px] md:h-[18px]`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-gray-300 truncate">{stat.label}</p>
                  <p className="text-sm md:text-base font-semibold text-white">{stat.count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-semibold text-blue-400 truncate pr-2">
                {selectedProduct ? `EDIT: ${selectedProduct.name}` : 'ADD PRODUCT'}
              </h3>
              <button 
                onClick={handleCancel}
                className="text-gray-400 hover:text-white flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Product Image */}
              <div className="mb-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                      ) : (
                        <>
                          <Camera className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">Upload Product Image</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>

              {/* Product Name */}
              <div className="mb-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Product Name"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

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

              {/* Attribute */}
              <div className="mb-4 relative attribute-dropdown-container">
                <div className="relative">
                  <input
                    type="text"
                    name="attribute"
                    value={formData.attribute}
                    onChange={handleInputChange}
                    placeholder="Enter product attributes"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Price (₹)"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Offer Price */}
              <div className="mb-4">
                <input
                  type="number"
                  name="offerPrice"
                  value={formData.offerPrice}
                  onChange={handleInputChange}
                  placeholder="Offer Price (₹)"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Brand */}
              <div className="mb-4">
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="Brand"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Product Description"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              {/* Stock */}
              <div className="mb-4">
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="Stock Quantity"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              {/* SKU */}
              <div className="mb-4">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="SKU"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Cash on Delivery */}
              <div className="mb-6">
                <select
                  name="cashOnDelivery"
                  value={formData.cashOnDelivery}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="no">Cash on Delivery: No</option>
                  <option value="yes">Cash on Delivery: Yes</option>
                </select>
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
                  {selectedProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {isProductSelectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-blue-400">SELECT PRODUCT</h3>
              <button 
                onClick={handleProductSelectCancel}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <button
                onClick={handleNewProduct}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus size={16} />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Categories Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">My Categories</h4>
                <button 
                  onClick={handleCategoryClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center space-x-1 transition-colors text-sm"
                >
                  <Plus size={16} />
                  <span>Add Category</span>
                </button>
              </div>
              {categories.length > 0 ? (
                <div className="bg-gray-700 rounded-lg overflow-hidden">
                   <div className="grid grid-cols-2 gap-4 p-4 bg-gray-600 text-gray-300 text-sm font-medium">
                      <div>Image</div>
                      <div>Category Name</div>
                    </div>
                    {categories.map((category) => {
                      const productCount = getProductCountByCategory(category.name);
                      return (
                        <div 
                          key={category.id} 
                          className="grid grid-cols-2 gap-4 p-4 border-t border-gray-600 items-center hover:bg-gray-600 cursor-pointer transition-colors"
                          onClick={() => handleCategoryClick(category)}
                        >
                          <div>
                            {category.image ? (
                              <img src={category.image} alt={category.name} className="w-12 h-12 object-cover rounded" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center">
                                <Package size={20} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="text-white">{category.name}</div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400">No categories available</p>
                  <button 
                    onClick={handleCategoryClick}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors mx-auto"
                  >
                    <Plus size={16} />
                    <span>Add First Category</span>
                  </button>
                </div>
              )}
            </div>


          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUpload
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUpload={handleBulkUpload}
        categories={categories}
        subCategories={subCategories}
      />

      {/* Add Category Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Add New Product</h3>
                <p className="text-sm text-gray-400 mt-1">Fill in the details below to create a new product</p>
              </div>
              <button 
                onClick={handleCategoryCancel}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCategorySubmit}>
              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Product Images
                </label>
                
                {/* Image Previews */}
                {categoryImagePreview.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {categoryImagePreview.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg border border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={loading}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload Area */}
                <div className="flex justify-center">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400">Upload Product Images</p>
                      <p className="text-xs text-gray-500 mt-1">Select multiple images</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      multiple
                      onChange={handleCategoryImageChange}
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>
              
              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                    placeholder="Enter product name"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={categoryFormData.description}
                    onChange={handleCategoryInputChange}
                    placeholder="Enter product description"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    disabled={loading}
                  />
                </div>

                {/* Price */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={categoryFormData.price}
                    onChange={handleCategoryInputChange}
                    placeholder="Enter price"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                {/* Offer Price */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Offer Price
                  </label>
                  <input
                    type="number"
                    name="offerPrice"
                    value={categoryFormData.offerPrice}
                    onChange={handleCategoryInputChange}
                    placeholder="Enter offer price"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                {/* Brand */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={categoryFormData.brand}
                    onChange={handleCategoryInputChange}
                    placeholder="Enter brand name"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={categoryFormData.category}
                    onChange={handleCategoryInputChange}
                    placeholder="Enter Category"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Sub Category */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sub Category *
                  </label>
                  <select
                    name="subCategory"
                    value={categoryFormData.subCategory}
                    onChange={handleCategoryInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  >
                    <option value="">Select Sub Category</option>
                    {subCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.name}>{subCategory.name}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Attributes */}
                {categoryFormData.category && categoryAttributes[categoryFormData.category] && (
                  <div className="col-span-1 md:col-span-2 mb-6">
                    <label className="block text-lg font-semibold text-blue-400 mb-4">
                      Attributes for {categoryFormData.category}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryAttributes[categoryFormData.category].map((attribute, index) => (
                        <div key={index} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {attribute}
                          </label>
                          <input
                            type="text"
                            name={`attribute_${attribute.replace(/[^a-zA-Z0-9]/g, '_')}`}
                            value={categoryFormData.attributes?.[attribute] || ''}
                            placeholder={`Enter ${attribute}`}
                            onChange={handleCategoryInputChange}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            disabled={loading}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                


                {/* Stock */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stock *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={categoryFormData.stock}
                    onChange={handleCategoryInputChange}
                    placeholder="Enter stock quantity"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="0"
                    disabled={loading}
                  />
                </div>

                {/* SKU */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={categoryFormData.sku}
                    onChange={handleCategoryInputChange}
                    placeholder="Enter SKU"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                {/* Cash on Delivery */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cash on Delivery
                  </label>
                  <select
                    name="cashOnDelivery"
                    value={categoryFormData.cashOnDelivery}
                    onChange={handleCategoryInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
              

              
              {/* Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCategoryCancel}
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
                  {loading ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;