'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import useMobileDetect from '@/hooks/useMobileDetect';
import { toast } from 'react-toastify';

// Predefined target images with fallbacks
const predefinedImages = [
  { 
    id: '1', 
    url: 'https://devimg.tinylittleme.com/card/w_1_E8NeQY_ver_1.jpeg',
    fallback: '/templates/template1.jpg'
  },
  { 
    id: '2', 
    url: 'https://devimg.tinylittleme.com/card/w_3_ZpEpWH_ver_1.jpeg',
    fallback: '/templates/template2.jpg'
  },
  { 
    id: '3', 
    url: 'https://devimg.tinylittleme.com/card/human_warrior_3_GOvOKB_ver_1.jpeg',
    fallback: '/templates/template3.jpg'
  },
  { 
    id: '4', 
    url: 'https://devimg.tinylittleme.com/card/human_warrior_4_Pw1Hxj_ver_1.jpeg',
    fallback: '/templates/template4.jpg'
  },
  { 
    id: '5', 
    url: 'https://devimg.tinylittleme.com/card/human_warrior_5_302M6D_ver_1.jpeg',
    fallback: '/templates/template5.jpg'
  },
  { 
    id: '6', 
    url: 'https://devimg.tinylittleme.com/card/human_warrior_6_0nRsJM_ver_1.jpeg',
    fallback: '/templates/template6.jpg'
  },
  { 
    id: '7', 
    url: 'https://devimg.tinylittleme.com/card/human_warrior_7_duaKrW_ver_1.jpeg',
    fallback: '/templates/template7.jpg'
  },
];

interface TargetImageSelectorProps {
  onSelectImage: (url: string) => void;
  selectedImage: string | null;
  disabled?: boolean;
}

const TargetImageSelector: React.FC<TargetImageSelectorProps> = ({
  onSelectImage,
  selectedImage,
  disabled = false
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const { isMobile } = useMobileDetect();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [useLocalImages, setUseLocalImages] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Track the selected image's ID for visual feedback
  useEffect(() => {
    if (selectedImage) {
      const found = predefinedImages.find(img => 
        img.url === selectedImage || img.fallback === selectedImage
      );
      setSelectedId(found?.id || null);
      setPreviewLoaded(false); // Reset loading state when image changes
    } else {
      setSelectedId(null);
    }
  }, [selectedImage]);

  // Handle horizontal scrolling with touch and mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Check if container needs horizontal scrolling
  useEffect(() => {
    const checkScrollable = () => {
      const container = scrollContainerRef.current;
      if (container) {
        setScrollable(container.scrollWidth > container.clientWidth);
      }
    };
    
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      window.removeEventListener('resize', checkScrollable);
    };
  }, []);

  // Helper function to handle image selection
  const handleSelectImage = (imageUrl: string, imageId: string) => {
    if (disabled) return;
    setSelectedId(imageId);
    onSelectImage(imageUrl);
    
    // Scroll to the selected image on mobile
    if (isMobile && scrollContainerRef.current) {
      const selectedElement = scrollContainerRef.current.querySelector(`[data-image-id="${imageId}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  // Handle image loading error
  const handleImageError = (imageId: string) => {
    const image = predefinedImages.find(img => img.id === imageId);
    if (!image) return;

    // Add to failed images set
    setFailedImages(prev => new Set([...prev, image.url]));
    
    // If this was the selected image, update with fallback
    if (selectedId === imageId) {
      onSelectImage(image.fallback);
    }
  };

  // Get the appropriate URL based on whether the image has failed
  const getImageUrl = (image: typeof predefinedImages[0]) => {
    return failedImages.has(image.url) ? image.fallback : image.url;
  };

  return (
    <div className="space-y-4">
      {/* Selected Image Preview Container */}
      {selectedImage && (
        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-[300px] max-h-[300px] aspect-square overflow-hidden rounded-lg border-2 border-blue-500 mb-4">
            <div className={`absolute inset-0 bg-gray-200 animate-pulse ${previewLoaded ? 'hidden' : 'block'}`}></div>
            <Image
              src={selectedImage}
              alt="Selected target image"
              fill
              className={`object-contain ${previewLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
              priority
              sizes="(max-width: 640px) 300px, 300px"
              onLoadingComplete={() => setPreviewLoaded(true)}
              onError={() => {
                const image = predefinedImages.find(img => img.url === selectedImage);
                if (image && !failedImages.has(image.url)) {
                  setFailedImages(prev => new Set([...prev, image.url]));
                  onSelectImage(image.fallback);
                }
                setPreviewLoaded(true);
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs text-center">
              Selected Template
            </div>
          </div>
        </div>
      )}
      
      <h3 className="text-base font-medium">
        {selectedImage ? "Change template" : "Select a template"} 
        {isMobile && scrollable && <span className="text-xs text-gray-500 ml-2">← Swipe to see more →</span>}
      </h3>
      
      {/* Scrollable container for mobile */}
      <div 
        ref={scrollContainerRef}
        className={`
          flex space-x-3 pb-2 
          ${isMobile ? 'overflow-x-auto scrollbar-hide snap-x snap-mandatory' : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3'}
        `}
        onWheel={isMobile ? handleWheel : undefined}
      >
        {predefinedImages.map((image) => {
          const isSelected = selectedId === image.id;
          const imageUrl = getImageUrl(image);
          
          return (
            <div
              key={image.id}
              data-image-id={image.id}
              className={`
                relative aspect-square overflow-hidden rounded-lg border-2 cursor-pointer flex-shrink-0
                ${isMobile ? 'w-24 h-24 snap-center' : 'w-20 h-20 sm:w-24 sm:h-24'}
                ${isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-300'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                transition-all duration-150 ${isSelected ? 'scale-100' : 'active:scale-95'}
              `}
              onClick={() => handleSelectImage(imageUrl, image.id)}
            >
              <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
              <Image
                src={imageUrl}
                alt={`Target image ${image.id}`}
                fill
                className="object-cover"
                sizes={isMobile ? '96px' : '(max-width: 640px) 80px, (max-width: 768px) 96px, 96px'}
                priority={parseInt(image.id) <= 3 || isSelected}
                onError={() => handleImageError(image.id)}
              />
              {isSelected && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <div className="bg-blue-500 rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TargetImageSelector; 