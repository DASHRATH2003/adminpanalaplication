import React, { useState, useEffect } from 'react';
import JsonUpload from '../components/JsonUpload';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import bulkUploadService from '../firebase/bulkUploadService';

const JsonUploadPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalUploads: 0,
    successfulUploads: 0,
    failedUploads: 0,
    lastUpload: null
  });

  useEffect(() => {
    // Load upload history from localStorage
    const history = JSON.parse(localStorage.getItem('jsonUploadHistory') || '[]');
    setUploadHistory(history);
    
    // Calculate stats
    const totalUploads = history.length;
    const successfulUploads = history.filter(h => h.status === 'success').length;
    const failedUploads = history.filter(h => h.status === 'failed').length;
    const lastUpload = history.length > 0 ? history[0] : null;
    
    setStats({
      totalUploads,
      successfulUploads,
      failedUploads,
      lastUpload
    });
  }, []);

  const handleDeleteUpload = (uploadId) => {
    if (window.confirm('Are you sure you want to delete this upload record?')) {
      const updatedHistory = uploadHistory.filter(upload => upload.id !== uploadId);
      setUploadHistory(updatedHistory);
      localStorage.setItem('jsonUploadHistory', JSON.stringify(updatedHistory));
      
      // Recalculate stats
      const totalUploads = updatedHistory.length;
      const successfulUploads = updatedHistory.filter(h => h.status === 'success').length;
      const failedUploads = updatedHistory.filter(h => h.status === 'failed').length;
      const lastUpload = updatedHistory.length > 0 ? updatedHistory[0] : null;
      
      setStats({
        totalUploads,
        successfulUploads,
        failedUploads,
        lastUpload
      });
    }
  };

  const handleUpload = async (jsonData) => {
    try {
      const result = await bulkUploadService.uploadProducts(jsonData, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
      
      // Add to upload history
      const uploadRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        status: 'success',
        totalProducts: jsonData.length,
        successCount: result.success.length,
        errorCount: result.errors.length,
        fileName: 'JSON Upload'
      };
      
      const newHistory = [uploadRecord, ...uploadHistory].slice(0, 10); // Keep last 10 uploads
      setUploadHistory(newHistory);
      localStorage.setItem('jsonUploadHistory', JSON.stringify(newHistory));
      
      // Update stats
      setStats(prev => ({
        totalUploads: prev.totalUploads + 1,
        successfulUploads: prev.successfulUploads + 1,
        failedUploads: prev.failedUploads,
        lastUpload: uploadRecord
      }));
      
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Add failed upload to history
      const uploadRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        status: 'failed',
        totalProducts: jsonData.length,
        successCount: 0,
        errorCount: jsonData.length,
        fileName: 'JSON Upload',
        error: error.message
      };
      
      const newHistory = [uploadRecord, ...uploadHistory].slice(0, 10);
      setUploadHistory(newHistory);
      localStorage.setItem('jsonUploadHistory', JSON.stringify(newHistory));
      
      // Update stats
      setStats(prev => ({
        totalUploads: prev.totalUploads + 1,
        successfulUploads: prev.successfulUploads,
        failedUploads: prev.failedUploads + 1,
        lastUpload: uploadRecord
      }));
      
      throw error;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteAllProducts = async () => {
    if (!window.confirm('Are you sure you want to delete ALL products from Firebase? This action cannot be undone!')) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log('Starting to delete all products...');
      const result = await bulkUploadService.deleteAllProducts();
      
      if (result.success) {
        alert(`Successfully deleted ${result.totalDeleted} products from Firebase!`);
        console.log('Delete result:', result);
        
        // Reset stats since all products are deleted
        setStats({
          totalUploads: 0,
          successfulUploads: 0,
          failedUploads: 0,
          lastUpload: null
        });
        
        // Clear upload history
        setUploadHistory([]);
        localStorage.removeItem('jsonUploadHistory');
      } else {
        alert(`Failed to delete products: ${result.error}`);
        console.error('Delete failed:', result);
      }
    } catch (error) {
      console.error('Error deleting products:', error);
      alert(`Error deleting products: ${error.message}`);
    } finally {
       setIsDeleting(false);
     }
   };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">JSON Bulk Upload</h1>
          <p className="text-gray-400">Upload products in bulk using JSON files</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Uploads</p>
                <p className="text-2xl font-bold text-white">{stats.totalUploads}</p>
              </div>
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Successful</p>
                <p className="text-2xl font-bold text-green-400">{stats.successfulUploads}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Failed</p>
                <p className="text-2xl font-bold text-red-400">{stats.failedUploads}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Last Upload</p>
                <p className="text-sm font-medium text-white">
                  {stats.lastUpload ? formatDate(stats.lastUpload.timestamp) : 'No uploads yet'}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Upload and Delete Buttons */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <Upload className="w-5 h-5" />
            Upload New JSON File
          </button>
          
          <button
            onClick={handleDeleteAllProducts}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <Trash2 className="w-5 h-5" />
            {isDeleting ? 'Deleting...' : 'Delete All Products'}
          </button>
        </div>

        {/* Upload History */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Upload History</h2>
            <p className="text-gray-400 text-sm mt-1">Record of previous uploads</p>
          </div>
          
          {uploadHistory.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Total Products
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {uploadHistory.map((upload) => (
                      <tr key={upload.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(upload.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            upload.status === 'success' 
                              ? 'bg-green-900/50 text-green-300' 
                              : 'bg-red-900/50 text-red-300'
                          }`}>
                            {upload.status === 'success' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <AlertCircle className="w-3 h-3 mr-1" />
                            )}
                            {upload.status === 'success' ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {upload.totalProducts}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {upload.fileName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            className="text-red-400 hover:text-red-300 transition-colors"
                            onClick={() => handleDeleteUpload(upload.id)}
                            title="Delete upload record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-6">
                {uploadHistory.map((upload) => (
                  <div key={upload.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm text-gray-300">{formatDate(upload.timestamp)}</div>
                        <div className="text-lg font-medium text-white">{upload.fileName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          upload.status === 'success' 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {upload.status === 'success' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          {upload.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                        <button 
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          onClick={() => handleDeleteUpload(upload.id)}
                          title="Delete upload record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Total</div>
                        <div className="text-white font-medium">{upload.totalProducts}</div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No upload history</h3>
              <p className="text-gray-500">No JSON files have been uploaded yet</p>
            </div>
          )}
        </div>

        {/* JSON Upload Modal */}
        <JsonUpload
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpload={handleUpload}
        />
      </div>
    </div>
  );
};

export default JsonUploadPage;