'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import useMobileDetect from '@/hooks/useMobileDetect';

// Predefined target images
const predefinedImages = [
  { id: '1', url: 'https://devimg.tinylittleme.com/card/w_1_E8NeQY_ver_1.jpeg' },
  { id: '2', url: 'https://devimg.tinylittleme.com/card/w_3_ZpEpWH_ver_1.jpeg' },
  { id: '3', url: 'https://devimg.tinylittleme.com/card/human_warrior_3_GOvOKB_ver_1.jpeg' },
  { id: '4', url: 'https://devimg.tinylittleme.com/card/human_warrior_4_Pw1Hxj_ver_1.jpeg' },
  { id: '5', url: 'https://devimg.tinylittleme.com/card/human_warrior_5_302M6D_ver_1.jpeg' },
  { id: '6', url: 'https://devimg.tinylittleme.com/card/human_warrior_6_0nRsJM_ver_1.jpeg' },
  { id: '7', url: 'https://devimg.tinylittleme.com/card/human_warrior_7_duaKrW_ver_1.jpeg' },
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
  const { isMobile, isTouch } = useMobileDetect();

  // Handle horizontal scrolling with touch and mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Check if container needs horizontal scrolling
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setScrollable(container.scrollWidth > container.clientWidth);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="relative aspect-square max-h-48 overflow-hidden rounded-lg border-2 border-blue-500 mb-4">
          <Image
            src={selectedImage}
            alt="Selected target image"
            fill
            className="object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs text-center">
            Selected Template
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
        {predefinedImages.map((image) => (
          <div
            key={image.id}
            className={`
              relative aspect-square overflow-hidden rounded-lg border-2 cursor-pointer flex-shrink-0
              ${isMobile ? 'w-24 h-24 snap-center' : ''}
              ${selectedImage === image.url ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-300'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              transition-all duration-150 active:scale-95
            `}
            onClick={() => !disabled && onSelectImage(image.url)}
          >
            <Image
              src={image.url}
              alt={`Target image ${image.id}`}
              fill
              className="object-cover"
              sizes={isMobile ? '96px' : '(max-width: 640px) 33vw, (max-width: 768px) 25vw, 14vw'}
              priority={parseInt(image.id) <= 3} // Load first 3 images with priority
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TargetImageSelector; 