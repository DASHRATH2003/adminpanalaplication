import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, Play, CheckCircle, FileSpreadsheet, Trash2, RefreshCw, Eye, EyeOff, Settings, AlertCircle, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

const PythonAutomation = () => {
  const [file, setFile] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [sellerId, setSellerId] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Column mappings (from Node.js code)
  const COLUMN_MAPPINGS = {
    name: ["title", "name", "product name", "product", "product title"],
    description: ["description", "product description", "body (html)", "details"],
    stock: ["stock", "quantity", "qty", "available stock"],
    sku: ["sku", "variant sku", "baseSku"],
    category: ["category", "product category", "Type"],
    subcategory: ["subcategory", "sub category"],
    brand: ["brand", "vendor"],
    price: ["price", "mrp"],
    offerPrice: ["offerprice", "msrp", "compare at price"],
    image: ["image1", "image 1", "img1", "image2", "image 2", "img2", "image3", "image4", "image5"],
    size: ["size"]
  };

  const CORE_FIELDS = new Set([
    "productId","name","name_lower","description","category","subcategory",
    "baseSku","brand","price","offerPrice","stock","timestamp","images",
    "sellerId","sizeVariants"
  ]);

  // Aliases
  const ALIASES = Object.values(COLUMN_MAPPINGS).flat().map(v => v.toLowerCase().trim());

  // HTML cleaner
  const cleanHtml = (text) => {
    if (!text || text === "NaN" || text === 'undefined' || text === 'null') return "";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(String(text), 'text/html');
      return doc.body.textContent || "";
    } catch {
      return String(text).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    }
  };

  const pickColumn = (possibleNames, availableColumns) => {
    for (const name of possibleNames) {
      for (const col of availableColumns) {
        if (col.trim().toLowerCase() === name.trim().toLowerCase()) return col;
      }
    }
    return null;
  };

  const safeNumber = (val) => {
    try {
      return parseInt(parseFloat(val)) || 0;
    } catch {
      return 0;
    }
  };
  const safeStr = (val) => {
    if (val === undefined || val === null) return "";
    const s = String(val).trim();
    return (s.toLowerCase() === "nan") ? "" : s;
  };

  // Normalizer
  const normalizeKeys = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(i => normalizeKeys(i));
    } else if (typeof obj === "object" && obj !== null) {
      const normalized = {};
      Object.entries(obj).forEach(([k, v]) => {
        normalized[k.toLowerCase().replace(/\s+/g, '')] = normalizeKeys(v);
      });
      return normalized;
    }
    return obj;
  };

  // File upload with drag and drop
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;
    validateAndSetFile(uploadedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const uploadedFile = e.dataTransfer.files[0];
    if (!uploadedFile) return;
    validateAndSetFile(uploadedFile);
  };

  const validateAndSetFile = (uploadedFile) => {
    const fileName = uploadedFile.name.toLowerCase();
    if (fileName.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      setFile(uploadedFile);
    } else {
      alert("Please upload only CSV or Excel files");
    }
  };

  const removeFile = () => {
    setFile(null);
    setProcessedData(null);
    setOriginalData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Excel → CSV
  const convertExcelToCSV = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_csv(ws));
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // CSV parser
  const parseCSV = (csvText) => {
    const lines = csvText.split("\n").filter(l => l.trim());
    if (!lines.length) return { headers: [], data: [] };
    const headers = lines[0].split(",").map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(",");
      const row = {};
      headers.forEach((h, i) => row[h] = values[i] || "");
      return row;
    });
    return { headers, data };
  };

  // Process CSV with progress tracking
  const processCSV = async () => {
    if (!file) return alert("Upload file first");
    setProcessing(true);
    setProcessingProgress(0);
    
    try {
      const fileName = file.name.toLowerCase();
      const csvText = (fileName.endsWith(".xlsx") || fileName.endsWith(".xls"))
        ? await convertExcelToCSV(file)
        : await file.text();

      const { headers, data } = parseCSV(csvText);
      setOriginalData(data);

      const products = {};
      const totalRows = data.length;
      
      data.forEach((row, idx) => {
        // Update progress every 10 rows
        if (idx % 10 === 0) {
          setProcessingProgress(Math.round((idx / totalRows) * 100));
        }
        
        const productId = safeStr(row["Product ID"] || row["id"] || row["SKU"] || `product_${idx+1}`);
        if (!productId) return;

        const nameCol = pickColumn(COLUMN_MAPPINGS.name, headers);
        const descCol = pickColumn(COLUMN_MAPPINGS.description, headers);
        const stockCol = pickColumn(COLUMN_MAPPINGS.stock, headers);
        const skuCol = pickColumn(COLUMN_MAPPINGS.sku, headers);
        const categoryCol = pickColumn(COLUMN_MAPPINGS.category, headers);
        const subcategoryCol = pickColumn(COLUMN_MAPPINGS.subcategory, headers);
        const brandCol = pickColumn(COLUMN_MAPPINGS.brand, headers);
        const priceCol = pickColumn(COLUMN_MAPPINGS.price, headers);
        const offerCol = pickColumn(COLUMN_MAPPINGS.offerPrice, headers);
        const sizeCol = pickColumn(COLUMN_MAPPINGS.size, headers);

        const size = safeStr(row[sizeCol] || "");
        const variantStock = safeNumber(row[stockCol] || 0);

        if (!products[productId]) {
          products[productId] = {
            productId,
            name: safeStr(row[nameCol] || "Untitled"),
            name_lower: safeStr(row[nameCol] || "untitled").toLowerCase(),
            description: descCol ? cleanHtml(row[descCol]) : "",
            category: safeStr(row[categoryCol] || ""),
            subcategory: safeStr(row[subcategoryCol] || ""),
            baseSku: safeStr(row[skuCol] || ""),
            brand: safeStr(row[brandCol] || ""),
            price: safeNumber(row[priceCol] || 0),
            offerPrice: offerCol ? safeNumber(row[offerCol]) : safeNumber(row[priceCol] || 0),
            stock: 0,
            timestamp: new Date().toISOString(),
            images: [],
            sellerId,
            sizeVariants: []
          };
          // Images
          const imageCols = headers.filter(c => c.toLowerCase().includes("image") || c.toLowerCase().includes("img"));
          products[productId].images = imageCols.map(c => safeStr(row[c] || "")).filter(Boolean);
        }

        if (size) {
          products[productId].sizeVariants.push({
            size,
            stock: variantStock,
            sku: safeStr(row[skuCol] || ""),
            price: safeNumber(row[priceCol] || 0)
          });
        }
        products[productId].stock += variantStock;

        // Extra fields
        headers.forEach(col => {
          const cleanCol = col.trim();
          if (
            !ALIASES.includes(cleanCol.toLowerCase()) &&
            !CORE_FIELDS.has(cleanCol) &&
            !cleanCol.toLowerCase().startsWith("image") &&
            cleanCol.toLowerCase() !== "size"
          ) {
            const val = safeStr(row[cleanCol]);
            if (val) products[productId][cleanCol] = val;
          }
        });
      });

      setProcessingProgress(100);
      const productList = Object.values(products);
      setProcessedData(productList);
      
      // Show success message with stats
      setTimeout(() => {
        alert(`✅ Successfully processed ${productList.length} products from ${totalRows} rows`);
        setProcessingProgress(0);
      }, 500);
      
    } catch (err) {
      alert("Processing Error: " + err.message);
    } finally {
      setProcessing(false);
      setTimeout(() => setProcessingProgress(0), 1000);
    }
  };

  // Download JSON
  const downloadJSON = () => {
    if (!processedData) return;
    const normalized = processedData.map(p => normalizeKeys(p));
    const dataStr = JSON.stringify(normalized, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Product Data Converter
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your CSV/Excel files into structured JSON data with intelligent column mapping, 
            HTML cleaning, and variant processing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload & Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Upload className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Upload Data File</h2>
              </div>
              
              <div 
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {!file ? (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drop your CSV or Excel file here
                      </p>
                      <p className="text-gray-500 mb-4">
                        or click to browse and select a file
                      </p>
                      <div className="text-sm text-gray-400">
                        Supports .csv, .xlsx, .xls formats
                      </div>
                      <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        File Selected Successfully
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-gray-600 mr-2" />
                            <span className="font-medium text-gray-900">{file.name}</span>
                          </div>
                          <button
                            onClick={removeFile}
                            className="text-red-500 hover:text-red-700 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Change File
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Configuration Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Settings className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seller ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                    placeholder="Enter seller ID for product attribution"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty if you don't need seller attribution
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Actions & Results */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Play className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Actions</h2>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={processCSV}
                  disabled={processing || !file}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    processing || !file
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {processing ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Convert File
                      </>
                    )}
                  </div>
                </button>

                {processingProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Processing progress</span>
                      <span>{processingProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button
                  onClick={downloadJSON}
                  disabled={!processedData}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    !processedData
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <Download className="w-5 h-5 mr-2" />
                    Download JSON
                  </div>
                </button>
              </div>
            </div>

            {/* Results Card */}
            {processedData && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Results</h2>
                  </div>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Products Processed:</span>
                    <span className="font-semibold text-gray-900">{processedData.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Original Rows:</span>
                    <span className="font-semibold text-gray-900">{originalData?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">File Format:</span>
                    <span className="font-semibold text-gray-900">JSON</span>
                  </div>
                </div>

                {showPreview && processedData.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Sample Product</h3>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 overflow-auto max-h-32">
                      <pre>{JSON.stringify(processedData[0], null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info Card */}
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default PythonAutomation;
