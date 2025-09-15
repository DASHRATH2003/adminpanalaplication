import React, { useState } from 'react';
import { Image } from 'lucide-react';

const ImageWithFallback = ({ 
  src, 
  alt, 
  className = "", 
  fallbackClassName = "",
  showIcon = true 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  if (imageError || !src) {
    return (
      <div className={`bg-gray-700 flex items-center justify-center ${fallbackClassName || className}`}>
        {showIcon && <Image size={16} className="text-gray-400" />}
      </div>
    );
  }

  return (
    <div className="relative">
      {imageLoading && (
        <div className={`absolute inset-0 bg-gray-700 flex items-center justify-center ${className}`}>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: imageLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default ImageWithFallback;