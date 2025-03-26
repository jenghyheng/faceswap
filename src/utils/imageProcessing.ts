import imageCompression from 'browser-image-compression';

export interface ProcessedImage {
  file: File;
  width: number;
  height: number;
  size: number;
  originalWidth?: number;
  originalHeight?: number;
  originalSize?: number;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_DIMENSION = 2048;
const TARGET_DIMENSION = 1600; // Better performance and compatibility
const COMPRESSION_OPTIONS = {
  maxSizeMB: MAX_FILE_SIZE_MB,
  maxWidthOrHeight: MAX_DIMENSION,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.8,
};

// Stronger compression for large mobile images
const STRONG_COMPRESSION_OPTIONS = {
  maxSizeMB: MAX_FILE_SIZE_MB / 2,
  maxWidthOrHeight: TARGET_DIMENSION,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.75,
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

    const originalWidth = img.width;
    const originalHeight = img.height;
    const originalSize = file.size;
    
    // Check if this is likely a large mobile image
    const isLikelyMobileImage = file.size > 3 * 1024 * 1024 && 
                              (img.width > 2000 || img.height > 2000);

    // Check if compression is needed
    const needsCompression = 
      file.size > MAX_FILE_SIZE_MB * 1024 * 1024 || 
      img.width > MAX_DIMENSION || 
      img.height > MAX_DIMENSION;

    if (needsCompression || isLikelyMobileImage) {
      console.log('Compressing image...', {
        originalSize: file.size,
        originalWidth: img.width,
        originalHeight: img.height,
        isLikelyMobileImage,
      });

      // Use appropriate compression options
      const compressionOptions = isLikelyMobileImage 
        ? STRONG_COMPRESSION_OPTIONS 
        : COMPRESSION_OPTIONS;
      
      const compressedFile = await imageCompression(file, compressionOptions);
      
      // If still too large, compress more aggressively
      if (compressedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024 * 0.9 || 
          compressedFile.size > 5 * 1024 * 1024) {
        console.log('Image still large, applying stronger compression');
        const strongerOptions = {
          ...STRONG_COMPRESSION_OPTIONS,
          maxWidthOrHeight: 1200,
          initialQuality: 0.7,
        };
        const recompressedFile = await imageCompression(compressedFile, strongerOptions);
        
        // Get dimensions of recompressed image
        const compressedImg = new Image();
        const compressedUrl = URL.createObjectURL(recompressedFile);
        
        await new Promise((resolve, reject) => {
          compressedImg.onload = resolve;
          compressedImg.onerror = reject;
          compressedImg.src = compressedUrl;
        });

        URL.revokeObjectURL(compressedUrl);

        return {
          file: recompressedFile,
          width: compressedImg.width,
          height: compressedImg.height,
          size: recompressedFile.size,
          originalWidth,
          originalHeight,
          originalSize
        };
      }
      
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
        originalWidth,
        originalHeight,
        originalSize
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
    return `Image size (${formatFileSize(file.size)}) exceeds ${MAX_FILE_SIZE_MB}MB. It will be automatically compressed.`;
  }
  
  // Warn about large images
  if (file.size > 5 * 1024 * 1024) {
    return `Large image detected (${formatFileSize(file.size)}). It will be compressed to fit size limits.`;
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

/**
 * Combine a result image with a frame overlay
 * @param resultImageUrl The URL of the result image
 * @param frameUrl The URL of the frame to overlay
 * @returns A Promise that resolves to a URL of the combined image
 */
export const combineImageWithFrame = async (
  resultImageUrl: string,
  frameUrl: string
): Promise<string> => {
  try {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    
    // Load the result image
    const resultImage = await loadImage(resultImageUrl);
    
    // Set canvas dimensions to match the image
    canvas.width = resultImage.width;
    canvas.height = resultImage.height;
    
    // Draw the base image
    ctx.drawImage(resultImage, 0, 0, canvas.width, canvas.height);
    
    // Load and draw the frame on top
    const frameImage = await loadImage(frameUrl);
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL
    const combinedImageUrl = canvas.toDataURL('image/jpeg', 0.95);
    
    return combinedImageUrl;
  } catch (error) {
    console.error('Error combining image with frame:', error);
    throw error;
  }
};

/**
 * Helper function to load an image from URL
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS for external images
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Convert a data URL to a File object
 */
export const dataUrlToFile = (
  dataUrl: string,
  filename: string = 'framed-image.jpg'
): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}; 