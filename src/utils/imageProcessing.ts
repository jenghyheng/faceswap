import imageCompression from 'browser-image-compression';

export interface ProcessedImage {
  file: File;
  width: number;
  height: number;
  size: number;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_DIMENSION = 2048;
const COMPRESSION_OPTIONS = {
  maxSizeMB: MAX_FILE_SIZE_MB,
  maxWidthOrHeight: MAX_DIMENSION,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.8,
};

export async function processImage(file: File): Promise<ProcessedImage> {
  try {
    // Create an image object to get dimensions
    const img = new Image();
    const imageUrl = URL.createObjectURL(file);
    
    // Wait for image to load to get dimensions
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Release the object URL
    URL.revokeObjectURL(imageUrl);

    // Check if compression is needed
    const needsCompression = 
      file.size > MAX_FILE_SIZE_MB * 1024 * 1024 || 
      img.width > MAX_DIMENSION || 
      img.height > MAX_DIMENSION;

    if (needsCompression) {
      console.log('Compressing image...', {
        originalSize: file.size,
        originalWidth: img.width,
        originalHeight: img.height,
      });

      const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
      
      // Get dimensions of compressed image
      const compressedImg = new Image();
      const compressedUrl = URL.createObjectURL(compressedFile);
      
      await new Promise((resolve, reject) => {
        compressedImg.onload = resolve;
        compressedImg.onerror = reject;
        compressedImg.src = compressedUrl;
      });

      URL.revokeObjectURL(compressedUrl);

      return {
        file: compressedFile,
        width: compressedImg.width,
        height: compressedImg.height,
        size: compressedFile.size,
      };
    }

    // If no compression needed, return original file with dimensions
    return {
      file,
      width: img.width,
      height: img.height,
      size: file.size,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image. Please try a different image.');
  }
}

export function validateImage(file: File): string | null {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'Please upload an image file.';
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Image size must be less than ${MAX_FILE_SIZE_MB}MB. This image will be automatically compressed.`;
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 