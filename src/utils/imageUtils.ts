// Target image utilities

// Predefined target images with fallbacks
export const predefinedImages = [
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

/**
 * Get a random target image from the predefined list
 * @param useLocalImages Whether to use local image URLs or remote URLs
 * @param failedImages Set of failed image URLs to avoid
 * @returns An object containing the selected image's URL and ID
 */
export function getRandomTargetImage(
  useLocalImages: boolean = false,
  failedImages: Set<string> = new Set()
): { url: string, id: string } {
  // Get a random index between 0 and the length of the predefined images
  const randomIndex = Math.floor(Math.random() * predefinedImages.length);
  const selectedImage = predefinedImages[randomIndex];
  
  // Determine if we should use the remote URL or local fallback
  const imageUrl = useLocalImages || failedImages.has(selectedImage.url) 
    ? selectedImage.fallback 
    : selectedImage.url;
  
  return {
    url: imageUrl,
    id: selectedImage.id
  };
}

/**
 * Get the appropriate URL for an image based on failures
 */
export function getImageUrl(
  image: typeof predefinedImages[0],
  failedImages: Set<string> = new Set()
): string {
  return failedImages.has(image.url) ? image.fallback : image.url;
} 