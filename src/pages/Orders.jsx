import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, User, CreditCard, Calendar, Edit, Trash2, Package, Plus, X, Save, Eye } from 'lucide-react';
import { orderService } from '../firebase/services';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [orderStats, setOrderStats] = useState({
    all: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    amount: '',
    paymentStatus: 'pending',
    status: 'pending',
    items: [],
    shippingAddress: ''
  });
  
  // Track pending status changes for each order
  const [pendingStatusChanges, setPendingStatusChanges] = useState({});

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders when filter changes
  useEffect(() => {
    filterOrders();
    calculateOrderStats();
  }, [orders, selectedFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching orders from Firebase...');
      let fetchedOrders;
      
      if (selectedFilter === 'all') {
        fetchedOrders = await orderService.getAll();
      } else {
        fetchedOrders = await orderService.getByStatus(selectedFilter);
      }
      
      console.log('Orders fetched successfully:', fetchedOrders.length);
      console.log('Sample order structure:', fetchedOrders.length > 0 ? fetchedOrders[0] : 'No orders');
      
      // Log date information for debugging
      if (fetchedOrders.length > 0) {
        fetchedOrders.slice(0, 3).forEach((order, index) => {
          console.log(`Order ${index + 1} date info:`, {
            createdAt: order.createdAt,
            createdAtType: typeof order.createdAt,
            createdAtConstructor: order.createdAt?.constructor?.name,
            hasSeconds: !!order.createdAt?.seconds,
            formattedDate: formatDate(order.createdAt)
          });
        });
      }
      
      // Log status information for debugging
      fetchedOrders.forEach((order, index) => {
        console.log(`Order ${index + 1} (${order.id}):`, {
          status: order.status,
          orderStatus: order.orderStatus,
          customerName: order.customerName
        });
      });
      
      // Log order totals for debugging
      fetchedOrders.forEach((order, index) => {
        const calculatedTotal = calculateOrderTotal(order);
        console.log(`Order ${index + 1} (${order.id}):`, {
          originalAmount: order.amount,
          calculatedTotal: calculatedTotal,
          hasItems: !!order.items,
          itemCount: order.items?.length || 0,
          items: order.items // Log full items array to see structure
        });
      });
      
      console.log('Setting orders state with:', fetchedOrders.length, 'orders');
      setOrders(fetchedOrders);
      console.log('Orders state updated, will trigger filter recalculation');
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Error fetching orders. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    console.log(`Filtering orders. Selected filter: ${selectedFilter}, Total orders: ${orders.length}`);
    if (selectedFilter === 'all') {
      setFilteredOrders(orders);
      console.log('Showing all orders:', orders.length);
    } else {
      const filtered = orders.filter(order => {
        const matches = order.status === selectedFilter;
        console.log(`Order ${order.id}: status=${order.status}, filter=${selectedFilter}, matches=${matches}`);
        return matches;
      });
      console.log(`Filtered orders for ${selectedFilter}:`, filtered.length);
      setFilteredOrders(filtered);
    }
  };

  const calculateOrderStats = () => {
    setLoadingStats(true);
    const stats = {
      all: orders.length,
      pending: orders.filter(order => order.status === 'pending').length,
      processing: orders.filter(order => order.status === 'processing').length,
      shipped: orders.filter(order => order.status === 'shipped').length,
      delivered: orders.filter(order => order.status === 'delivered').length,
      cancelled: orders.filter(order => order.status === 'cancelled').length
    };
    setOrderStats(stats);
    setLoadingStats(false);
  };

  // Refresh orders and statistics
  const refreshOrders = async () => {
    await fetchOrders();
  };

  const handleFilterChange = (e) => {
    setSelectedFilter(e.target.value);
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      amount: calculateOrderTotal(order),
      paymentStatus: order.paymentStatus || 'pending',
      status: order.status || 'pending',
      items: JSON.stringify(order.items || [], null, 2),
      shippingAddress: order.shippingAddress || '',
      customerId: order.customerId || null
    });
    setShowModal(true);
  };

  const handleView = (order) => {
    setViewingOrder(order);
    setShowViewModal(true);
  };

  const handleDelete = async (orderId, customerId = null) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await orderService.delete(orderId, customerId);
        await fetchOrders(); // Refresh the list
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error deleting order');
      }
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    
    try {
      let processedFormData = { ...formData };
      
      // Parse items JSON if it's a string
      if (typeof processedFormData.items === 'string') {
        try {
          processedFormData.items = JSON.parse(processedFormData.items);
        } catch (error) {
          console.error('Error parsing items JSON:', error);
          alert('Invalid items format. Please check your JSON.');
          return;
        }
      }
      
      // Ensure amount is a number
      processedFormData.amount = parseFloat(processedFormData.amount) || 0;
      
      if (editingOrder) {
        // Update existing order - preserve customerId if not provided
        if (!processedFormData.customerId && editingOrder.customerId) {
          processedFormData.customerId = editingOrder.customerId;
        }
        await orderService.update(editingOrder.id, processedFormData);
      } else {
        // Add new order
        await orderService.add(processedFormData);
      }
      
      setShowModal(false);
      setEditingOrder(null);
      resetForm();
      await fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error saving order: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      amount: '',
      paymentStatus: 'pending',
      status: 'pending',
      items: '[]',
      shippingAddress: '',
      customerId: null
    });
  };

  const handleAddNew = () => {
    resetForm();
    setEditingOrder(null);
    setShowModal(true);
  };

  const handleStatusUpdate = async (orderId, newStatus, customerId = null) => {
    try {
      console.log(`Updating order ${orderId} status to ${newStatus}...`);
      
      // Immediately update the local state for real-time feel
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, orderStatus: newStatus }
            : order
        )
      );
      
      // Update Firebase
      await orderService.updateStatus(orderId, newStatus, customerId);
      console.log(`Order ${orderId} status updated to ${newStatus} in Firebase`);
      
      // Wait for Firebase to propagate the change
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Always fetch all orders first to ensure we get the updated order
      console.log('Fetching all orders to verify update...');
      const allOrders = await orderService.getAll();
      
      // Find the updated order to verify
      const updatedOrder = allOrders.find(o => o.id === orderId);
      console.log(`Verification - Order ${orderId} status after refresh:`, updatedOrder?.status);
      
      // Set the orders state with all orders
      setOrders(allOrders);
      
      // Now apply the current filter locally
      if (selectedFilter !== 'all') {
        const filtered = allOrders.filter(order => order.status === selectedFilter);
        setFilteredOrders(filtered);
        console.log(`Applied filter ${selectedFilter}: ${filtered.length} orders`);
      } else {
        setFilteredOrders(allOrders);
      }
      
      // Recalculate stats
      calculateOrderStats();
      
      console.log(`Status update completed successfully`);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
      
      // If there's an error, revert to fetching normally
      await fetchOrders();
    }
  };

  // Handle status select change (store pending change)
  const handleStatusSelectChange = (orderId, newStatus) => {
    setPendingStatusChanges(prev => ({
      ...prev,
      [orderId]: newStatus
    }));
  };

  // Handle update button click (apply the pending change)
  const handleStatusUpdateClick = async (orderId, customerId = null) => {
    const newStatus = pendingStatusChanges[orderId];
    if (newStatus) {
      await handleStatusUpdate(orderId, newStatus, customerId);
      // Clear the pending change after successful update
      setPendingStatusChanges(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
      // Handle Firebase Timestamp objects
      if (date && typeof date === 'object' && date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      // Handle string dates
      const dateObj = new Date(date);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      return dateObj.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;
  };

  const calculateOrderTotal = (order) => {
    console.log('Calculating total for order:', order.id, 'Amount:', order.amount, 'totalAmount:', order.totalAmount, 'Items:', order.items, 'Products:', order.products);
    
    // Check for totalAmount field first (this is what your Firebase shows)
    if (order.totalAmount && order.totalAmount > 0) {
      console.log('Using totalAmount field:', order.totalAmount);
      return order.totalAmount;
    }
    
    // Check for amount field (legacy support)
    if (order.amount && order.amount > 0) {
      console.log('Using existing amount:', order.amount);
      return order.amount;
    }
    
    // Calculate total from products array (your Firebase structure)
    if (order.products && Array.isArray(order.products) && order.products.length > 0) {
      console.log('Calculating from products array:', order.products);
      const total = order.products.reduce((sum, product, index) => {
        // Handle different possible product structures
        let itemPrice = 0;
        
        // Try common price field names
        if (product.price && !isNaN(parseFloat(product.price))) {
          itemPrice = parseFloat(product.price);
        } else if (product.sellingPrice && !isNaN(parseFloat(product.sellingPrice))) {
          itemPrice = parseFloat(product.sellingPrice);
        } else if (product.mrp && !isNaN(parseFloat(product.mrp))) {
          itemPrice = parseFloat(product.mrp);
        } else if (product.cost && !isNaN(parseFloat(product.cost))) {
          itemPrice = parseFloat(product.cost);
        } else if (product.name && !isNaN(parseFloat(product.name))) {
          itemPrice = parseFloat(product.name);
        } else {
          console.log(`Product ${index} has no recognizable price field:`, product);
        }
        
        const itemQuantity = parseInt(product.quantity) || parseInt(product.qty) || parseInt(product.count) || 1;
        const itemTotal = itemPrice * itemQuantity;
        console.log(`Product ${index}: price=${itemPrice}, qty=${itemQuantity}, total=${itemTotal}, product:`, product);
        return sum + itemTotal;
      }, 0);
      console.log('Calculated total from products:', total);
      return total;
    }
    
    // Fallback: Calculate from items array (legacy support)
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      console.log('Calculating from items array:', order.items);
      const total = order.items.reduce((sum, item, index) => {
        // Handle different possible item structures
        let itemPrice = 0;
        
        // Try common price field names
        if (item.price && !isNaN(parseFloat(item.price))) {
          itemPrice = parseFloat(item.price);
        } else if (item.sellingPrice && !isNaN(parseFloat(item.sellingPrice))) {
          itemPrice = parseFloat(item.sellingPrice);
        } else if (item.mrp && !isNaN(parseFloat(item.mrp))) {
          itemPrice = parseFloat(item.mrp);
        } else if (item.cost && !isNaN(parseFloat(item.cost))) {
          itemPrice = parseFloat(item.cost);
        } else if (item.name && !isNaN(parseFloat(item.name))) {
          itemPrice = parseFloat(item.name);
        } else {
          console.log(`Item ${index} has no recognizable price field:`, item);
        }
        
        const itemQuantity = parseInt(item.quantity) || parseInt(item.qty) || parseInt(item.count) || 1;
        const itemTotal = itemPrice * itemQuantity;
        console.log(`Item ${index}: price=${itemPrice}, qty=${itemQuantity}, total=${itemTotal}, item:`, item);
        return sum + itemTotal;
      }, 0);
      console.log('Calculated total from items:', total);
      return total;
    }
    
    console.log('No amount, totalAmount, products, or items found, returning 0');
    return 0;
  };

  // Extract SKUs from order products/items
  const extractOrderSKUs = (order) => {
    const skus = [];
    
    // Check products array first
    if (order.products && Array.isArray(order.products)) {
      order.products.forEach(product => {
        if (product.sku) {
          skus.push(product.sku);
        }
      });
    }
    
    // Check items array (legacy)
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        if (item.sku) {
          skus.push(item.sku);
        }
      });
    }
    
    return skus.length > 0 ? skus.join(', ') : 'N/A';
  };



  return (
    <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h2 className="text-xl md:text-2xl font-semibold text-white">Orders</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button 
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Add Order
          </button>
          <div className="relative">
            <select 
              value={selectedFilter}
              onChange={handleFilterChange}
              className="w-full sm:w-auto bg-gray-700 text-white px-3 md:px-4 py-2 pr-8 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm md:text-base"
            >
              <option value="all">All orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
          <button 
            onClick={handleRefresh}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw size={18} className={`md:w-5 md:h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className={`rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition-colors ${
          selectedFilter === 'all' ? 'bg-blue-900 border-2 border-blue-500' : 'bg-gray-800'
        }`} onClick={() => setSelectedFilter('all')}>
          <div className="text-2xl font-bold text-blue-400">
            {loadingStats ? <div className="animate-pulse bg-gray-600 h-8 w-8 rounded mx-auto"></div> : orderStats.all}
          </div>
          <div className="text-sm text-gray-400">Total Orders</div>
        </div>
        <div className={`rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition-colors ${
          selectedFilter === 'pending' ? 'bg-yellow-900 border-2 border-yellow-500' : 'bg-gray-800'
        }`} onClick={() => setSelectedFilter('pending')}>
          <div className="text-2xl font-bold text-yellow-400">
            {loadingStats ? <div className="animate-pulse bg-gray-600 h-8 w-8 rounded mx-auto"></div> : orderStats.pending}
          </div>
          <div className="text-sm text-gray-400">Pending</div>
        </div>
        <div className={`rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition-colors ${
          selectedFilter === 'processing' ? 'bg-orange-900 border-2 border-orange-500' : 'bg-gray-800'
        }`} onClick={() => setSelectedFilter('processing')}>
          <div className="text-2xl font-bold text-orange-400">
            {loadingStats ? <div className="animate-pulse bg-gray-600 h-8 w-8 rounded mx-auto"></div> : orderStats.processing}
          </div>
          <div className="text-sm text-gray-400">Processing</div>
        </div>
        <div className={`rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition-colors ${
          selectedFilter === 'shipped' ? 'bg-purple-900 border-2 border-purple-500' : 'bg-gray-800'
        }`} onClick={() => setSelectedFilter('shipped')}>
          <div className="text-2xl font-bold text-purple-400">
            {loadingStats ? <div className="animate-pulse bg-gray-600 h-8 w-8 rounded mx-auto"></div> : orderStats.shipped}
          </div>
          <div className="text-sm text-gray-400">Shipped</div>
        </div>
        <div className={`rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition-colors ${
          selectedFilter === 'delivered' ? 'bg-green-900 border-2 border-green-500' : 'bg-gray-800'
        }`} onClick={() => setSelectedFilter('delivered')}>
          <div className="text-2xl font-bold text-green-400">
            {loadingStats ? <div className="animate-pulse bg-gray-600 h-8 w-8 rounded mx-auto"></div> : orderStats.delivered}
          </div>
          <div className="text-sm text-gray-400">Delivered</div>
        </div>
        <div className={`rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition-colors ${
          selectedFilter === 'cancelled' ? 'bg-red-900 border-2 border-red-500' : 'bg-gray-800'
        }`} onClick={() => setSelectedFilter('cancelled')}>
          <div className="text-2xl font-bold text-red-400">
            {loadingStats ? <div className="animate-pulse bg-gray-600 h-8 w-8 rounded mx-auto"></div> : orderStats.cancelled}
          </div>
          <div className="text-sm text-gray-400">Cancelled</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-white mb-4">
            {selectedFilter === 'all' ? 'All Orders' : `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Orders`} ({filteredOrders.length})
          </h3>
          <button
            onClick={refreshOrders}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
          <span className="ml-2 text-white">Loading orders...</span>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Customer Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">SKU</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Order Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Payment Method/Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                        <Package className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                        <p className="text-lg font-medium text-gray-300">No orders available</p>
                        <p className="text-sm text-gray-400">Orders will appear here when customers place them</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="border-t border-gray-700 hover:bg-gray-750">
                        <td className="px-6 py-4 text-white">{order.customerName}</td>
                        <td className="px-6 py-4 text-white">
                          {extractOrderSKUs(order)}
                        </td>
                        <td className="px-6 py-4 text-white">
                          {formatCurrency(calculateOrderTotal(order))}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-300">
                              {order.paymentMethod || 'N/A'}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.paymentStatus === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : order.paymentStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered' 
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{formatDate(order.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex flex-col space-y-1">
                              <select
                                value={pendingStatusChanges[order.id] || order.status}
                                onChange={(e) => handleStatusSelectChange(order.id, e.target.value)}
                                className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              {pendingStatusChanges[order.id] && pendingStatusChanges[order.id] !== order.status && (
                                <button
                                  onClick={() => handleStatusUpdateClick(order.id, order.customerId)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-colors"
                                >
                                  Update
                                </button>
                              )}
                            </div>
                            <button 
                              onClick={() => handleView(order)}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => handleEdit(order)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(order.id, order.customerId)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 size={16} />
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
        </>
      )}

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <p className="text-lg font-medium text-gray-300">No orders available</p>
            <p className="text-sm text-gray-400">Orders will appear here when customers place them</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-gray-800 rounded-lg p-4 shadow-md">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {order.customerName}
                    </div>
                    <div className="text-xs text-gray-400">
                      Order #{order.id}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {formatCurrency(calculateOrderTotal(order))}
                  </div>
                  <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-300">
                    <Package className="h-4 w-4 mr-2 text-gray-400" />
                    <span>SKU</span>
                  </div>
                  <span className="text-sm text-gray-300">
                    {extractOrderSKUs(order)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-300">
                    <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Payment Method</span>
                  </div>
                  <span className="text-sm text-gray-300">
                    {order.paymentMethod || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-300">
                    <Package className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Payment Status</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : order.paymentStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-300">
                    <Package className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Order Status</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'delivered' 
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'shipped'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-3 border-t border-gray-700">
                <select
                  value={pendingStatusChanges[order.id] || order.status}
                  onChange={(e) => handleStatusSelectChange(order.id, e.target.value)}
                  className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {pendingStatusChanges[order.id] && pendingStatusChanges[order.id] !== order.status && (
                  <button
                    onClick={() => handleStatusUpdateClick(order.id, order.customerId)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Update Status</span>
                  </button>
                )}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleView(order)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                  <button 
                    onClick={() => handleEdit(order)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(order.id, order.customerId)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">
                {editingOrder ? 'Edit Order' : 'Add New Order'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Order Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Payment Status
                </label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Items (JSON format)
                </label>
                <textarea
                  value={formData.items}
                  onChange={(e) => setFormData({...formData, items: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder='[{"name": "Product Name", "quantity": 1, "price": 100}]'
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingOrder ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {showViewModal && viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">
                Order Details
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Name</p>
                    <p className="text-xl text-white font-medium">{viewingOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Order ID</p>
                    <p className="text-xl text-white font-medium">#{viewingOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-lg text-white">{viewingOrder.customerEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="text-lg text-white">{viewingOrder.customerPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3">Order Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Amount</p>
                    <p className="text-2xl text-green-400 font-bold">{formatCurrency(calculateOrderTotal(viewingOrder))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Order Date</p>
                    <p className="text-lg text-white">{formatDate(viewingOrder.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Payment Method</p>
                    <p className="text-lg text-white">{viewingOrder.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">SKU</p>
                    <p className="text-lg text-white">{extractOrderSKUs(viewingOrder)}</p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3">Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Order Status</p>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      viewingOrder.status === 'delivered' 
                        ? 'bg-green-100 text-green-800'
                        : viewingOrder.status === 'shipped'
                        ? 'bg-blue-100 text-blue-800'
                        : viewingOrder.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Payment Status</p>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      viewingOrder.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : viewingOrder.paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingOrder.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Information */}
              {(viewingOrder.items || viewingOrder.products) && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Items</h4>
                  <div className="space-y-3">
                    {(viewingOrder.items || viewingOrder.products || []).map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-600 rounded p-3">
                        <div>
                          <p className="text-lg text-white font-medium">{item.name || item.productName || 'Unknown Product'}</p>
                          <p className="text-sm text-gray-400">Quantity: {item.quantity || 1}</p>
                          {item.sku && <p className="text-sm text-gray-400">SKU: {item.sku}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-lg text-white font-semibold">{formatCurrency(item.price || 0)}</p>
                          <p className="text-sm text-gray-400">Subtotal: {formatCurrency((item.price || 0) * (item.quantity || 1))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {viewingOrder.shippingAddress && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Shipping Address</h4>
                  <p className="text-lg text-white">{viewingOrder.shippingAddress}</p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;