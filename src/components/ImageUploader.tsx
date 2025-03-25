'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { processImage, validateImage, formatFileSize, ProcessedImage } from '@/utils/imageProcessing';
import { toast } from 'react-toastify';

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

  const handleImageProcess = async (file: File) => {
    try {
      setIsProcessing(true);

      // Validate the image first
      const validationError = validateImage(file);
      if (validationError) {
        toast.info(validationError);
      }

      // Process the image (compress if needed)
      const processedImage = await processImage(file);
      setUploadProgress(processedImage);

      // If the image was compressed, show a message
      if (processedImage.file !== file) {
        toast.success(`Image compressed from ${formatFileSize(file.size)} to ${formatFileSize(processedImage.size)}`);
      }

      onImageSelected(processedImage.file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      await handleImageProcess(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic']
    },
    maxFiles: 1,
    disabled: disabled || isProcessing
  });

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`p-6 border-2 border-dashed rounded-lg text-center transition-all ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
            <p className="mb-2">{label}</p>
            <p className="text-sm text-gray-500">
              Drag & drop an image here, or click to select<br />
              Supports JPEG, PNG, WebP, HEIC • Max {formatFileSize(10 * 1024 * 1024)}
            </p>
          </div>
        )}
      </div>

      {uploadProgress && !isProcessing && (
        <div className="text-sm text-gray-500">
          <p>Image details:</p>
          <ul className="list-disc list-inside">
            <li>Size: {formatFileSize(uploadProgress.size)}</li>
            <li>Dimensions: {uploadProgress.width} x {uploadProgress.height}px</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 