'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

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
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onImageSelected(acceptedFiles[0]);
    }
  }, [onImageSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled
  });

  return (
    <div 
      {...getRootProps()} 
      className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${
        isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-blue-500">Drop the image here...</p>
      ) : (
        <div>
          <p className="mb-2">{label}</p>
          <p className="text-sm text-gray-500">Drag & drop an image here, or click to select</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 