'use client';

import React from 'react';
import Image from 'next/image';

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
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select Target Image</h2>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {predefinedImages.map((image) => (
          <div
            key={image.id}
            className={`
              relative aspect-square border-2 rounded-lg overflow-hidden cursor-pointer 
              ${selectedImage === image.url ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-300'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !disabled && onSelectImage(image.url)}
          >
            <Image
              src={image.url}
              alt={`Target image ${image.id}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TargetImageSelector; 