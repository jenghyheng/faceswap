const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

// Target images with the updated URLs
const TARGET_IMAGES = [
  {
    id: '1',
    url: 'https://dev-img.tinylittle.me/tiny-little-me/uploads/w_1_E8NeQY_ver_1',
    destPath: path.join(__dirname, '../public/images/warrior_1.jpg')
  },
  {
    id: '2',
    url: 'https://dev-img.tinylittle.me/tiny-little-me/uploads/w_3_ZpEpWH_ver_1',
    destPath: path.join(__dirname, '../public/images/warrior_2.jpg')
  },
  {
    id: '3',
    url: 'https://dev-img.tinylittle.me/tiny-little-me/uploads/human_warrior_3_GOvOKB_ver_1',
    destPath: path.join(__dirname, '../public/images/human_warrior_3.jpg')
  },
  {
    id: '4',
    url: 'https://dev-img.tinylittle.me/tiny-little-me/uploads/human_warrior_4_Pw1Hxj_ver_1',
    destPath: path.join(__dirname, '../public/images/human_warrior_4.jpg')
  },
  {
    id: '5',
    url: 'https://dev-img.tinylittle.me/tiny-little-me/uploads/human_warrior_5_302M6D_ver_1',
    destPath: path.join(__dirname, '../public/images/human_warrior_5.jpg')
  },
  {
    id: '6',
    url: 'https://dev-img.tinylittle.me/tiny-little-me/uploads/human_warrior_6_0nRsJM_ver_1',
    destPath: path.join(__dirname, '../public/images/human_warrior_6.jpg')
  },
  {
    id: '7',
    url: 'https://dev-img.tinylittle.me/tiny-little-me/uploads/human_warrior_7_duaKrW_ver_1',
    destPath: path.join(__dirname, '../public/images/human_warrior_7.jpg')
  }
];

// Ensure directory exists
const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

/**
 * Download an image from a URL
 */
async function downloadImage(url, destPath) {
  try {
    console.log(`Downloading ${url}...`);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    await writeFileAsync(destPath, response.data);
    console.log(`Downloaded to ${destPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to download ${url}:`, error.message);
    return false;
  }
}

/**
 * Main function to download all images
 */
async function downloadAllImages() {
  console.log('Starting download of images...');
  
  const results = await Promise.all(
    TARGET_IMAGES.map(image => downloadImage(image.url, image.destPath))
  );
  
  const succeeded = results.filter(result => result).length;
  console.log(`Downloaded ${succeeded} of ${TARGET_IMAGES.length} images`);
}

// Run the download
downloadAllImages().catch(console.error); 