'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import useMobileDetect from '@/hooks/useMobileDetect';

// Define the available frames
const frames = [
  { id: 'none', name: 'No Frame', url: null },
  { id: 'gold', name: 'Gold Frame', url: '/frames/frame-gold.svg' },
  { id: 'blue', name: 'Royal Blue', url: '/frames/frame-blue.svg' },
  { id: 'red', name: 'Ruby Red', url: '/frames/frame-red.svg' },
  { id: 'black', name: 'Classic Black', url: '/frames/simple-black.svg' },
];

interface FrameSelectorProps {
  onSelectFrame: (frameUrl: string | null) => void;
  selectedFrame: string | null;
  resultImage: string | null;
  disabled?: boolean;
}

const FrameSelector: React.FC<FrameSelectorProps> = ({
  onSelectFrame,
  selectedFrame,
  resultImage,
  disabled = false
}) => {
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useMobileDetect();

  // Reset loaded states when images change
  useEffect(() => {
    setPreviewLoaded(false);
    setFrameLoaded(false);
  }, [selectedFrame, resultImage]);

  // Handle frame selection
  const handleSelectFrame = (frameUrl: string | null) => {
    if (disabled) return;
    onSelectFrame(frameUrl);
  };

  // Handle horizontal scrolling with touch and mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview with frame */}
      {resultImage && (
        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-[300px] max-h-[300px] aspect-square overflow-hidden rounded-lg border-2 border-green-500 mb-4">
            <div className={`absolute inset-0 bg-gray-200 animate-pulse ${previewLoaded ? 'hidden' : 'block'}`}></div>
            
            {/* Base image */}
            <Image
              src={resultImage}
              alt="Your image with frame"
              fill
              className="object-contain"
              priority
              sizes="(max-width: 640px) 300px, 300px"
              onLoadingComplete={() => setPreviewLoaded(true)}
            />

            {/* Frame overlay */}
            {selectedFrame && selectedFrame !== 'none' && (
              <div className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${frameLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <Image
                  src={selectedFrame}
                  alt="Frame"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 300px, 300px"
                  onLoadingComplete={() => setFrameLoaded(true)}
                />
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs text-center">
              {selectedFrame ? 'Preview with frame' : 'Original image'}
            </div>
          </div>
        </div>
      )}
      
      <h3 className="text-lg font-medium">
        {selectedFrame ? "Change frame style" : "Add a decorative frame"} 
        {isMobile && <span className="text-xs text-gray-500 ml-2">← Swipe to see more →</span>}
      </h3>
      
      {/* Scrollable frame options container */}
      <div 
        ref={scrollContainerRef}
        className={`
          flex space-x-3 pb-2 overflow-x-auto scrollbar-hide
          ${isMobile ? 'snap-x snap-mandatory' : ''}
        `}
        onWheel={isMobile ? handleWheel : undefined}
      >
        {frames.map((frame) => {
          const isSelected = selectedFrame === frame.url;
          
          return (
            <div
              key={frame.id}
              className={`
                relative flex-shrink-0 w-24 h-24 rounded-lg border-2 cursor-pointer overflow-hidden
                ${isSelected ? 'border-green-500 ring-2 ring-green-300' : 'border-gray-200 hover:border-gray-300'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                transition-all duration-150 ${isSelected ? 'scale-100' : 'active:scale-95'}
                ${isMobile ? 'snap-center' : ''}
              `}
              onClick={() => handleSelectFrame(frame.url)}
            >
              {frame.id === 'none' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    {/* Show a placeholder photo in the background */}
                    <div className="w-3/4 h-3/4 rounded bg-gray-300 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-0">
                    <Image
                      src={frame.url || ''}
                      alt={`Frame ${frame.name}`}
                      fill
                      className="object-contain"
                      sizes="96px"
                    />
                  </div>
                </>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 text-white text-[10px] text-center">
                {frame.name}
              </div>
              
              {isSelected && (
                <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FrameSelector; 