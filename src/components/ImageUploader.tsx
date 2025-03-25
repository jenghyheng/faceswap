'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { processImage, validateImage, formatFileSize, ProcessedImage } from '@/utils/imageProcessing';
import { toast } from 'react-toastify';
import useMobileDetect from '@/hooks/useMobileDetect';
import Image from 'next/image';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  label: string;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelected, 
  label, 
  disabled = false 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ProcessedImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isMobile, isTouch } = useMobileDetect();
  
  // Clean up object URLs when component unmounts or when previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  // Reset the file input value to ensure we can select the same file again
  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isProcessing]);

  const clearImage = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  const handleImageProcess = async (file: File) => {
    try {
      // Clear any existing preview first
      clearImage();
      
      setIsProcessing(true);

      // Create preview immediately for better UX
      const tempPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(tempPreviewUrl);

      // Validate the image first
      const validationError = validateImage(file);
      if (validationError) {
        toast.info(validationError);
      }

      // Process the image (compress if needed)
      const processedImage = await processImage(file);
      setUploadProgress(processedImage);

      // If the image was compressed, show a message and update preview
      if (processedImage.file !== file) {
        // Update the preview with processed image
        URL.revokeObjectURL(tempPreviewUrl);
        const newPreviewUrl = URL.createObjectURL(processedImage.file);
        setPreviewUrl(newPreviewUrl);
        
        toast.success(`Image compressed from ${formatFileSize(file.size)} to ${formatFileSize(processedImage.size)}`);
      }

      onImageSelected(processedImage.file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process image');
      clearImage();
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      await handleImageProcess(acceptedFiles[0]);
    }
  }, [handleImageProcess]);

  const handleNativeInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await handleImageProcess(files[0]);
    }
  };

  const handleMobileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic']
    },
    maxFiles: 1,
    disabled: disabled || isProcessing,
    noClick: isTouch, // Disable click on touch devices to avoid double dialogs
  });

  return (
    <div className="space-y-4">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleNativeInputChange}
        accept=".jpeg,.jpg,.png,.webp,.heic,image/*"
        className="hidden"
        key={`file-input-${isProcessing ? 'processing' : 'ready'}`} // Force new instance on state change
      />

      {/* Mobile-friendly layout with preview */}
      {previewUrl ? (
        <div className="relative">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-4 border-2 border-blue-400">
            <Image 
              src={previewUrl} 
              alt="Preview" 
              fill 
              className="object-contain" 
              priority
              key={previewUrl} // Force re-render on new preview
            />
          </div>
          
          {!isProcessing && (
            <button 
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
              aria-label="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
              <div className="text-white text-center p-4">
                <div className="mb-2">Processing...</div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div 
          {...getRootProps()} 
          className={`p-6 border-2 border-dashed rounded-lg text-center transition-all ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={handleMobileClick}
        >
          <input {...getInputProps()} />
          {isProcessing ? (
            <div className="space-y-2">
              <p className="text-blue-500">Processing image...</p>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          ) : isDragActive ? (
            <p className="text-blue-500">Drop the image here...</p>
          ) : (
            <div>
              <div className="flex flex-col items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-gray-400 mb-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                <p className="mb-1 font-medium">{label}</p>
                <p className="text-sm text-gray-500">
                  {isMobile ? 'Tap to take a photo or select from gallery' : 'Drag & drop or click to select'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports JPEG, PNG, WebP, HEIC • Max {formatFileSize(10 * 1024 * 1024)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    
      {uploadProgress && !isProcessing && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">Image details:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p>Size: {formatFileSize(uploadProgress.size)}</p>
              <p>Dimensions: {uploadProgress.width} × {uploadProgress.height}px</p>
            </div>
            <div className="text-right">
              <button 
                onClick={handleMobileClick}
                className="text-blue-500 underline"
                disabled={disabled || isProcessing}
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 