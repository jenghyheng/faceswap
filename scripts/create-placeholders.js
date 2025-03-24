const fs = require('fs');
const path = require('path');

const IMAGES = [
  'knight_moon.jpg',
  'mage_green.jpg',
  'fire_warrior.jpg',
  'knight_spear.jpg',
  'knight_staff.jpg',
  'knight_beard.jpg',
  'knight_halo.jpg',
];

// Create a simple placeholder SVG with the image name
function createPlaceholderSVG(name) {
  return `
<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#333" text-anchor="middle">${name}</text>
</svg>
  `.trim();
}

// Ensure images directory exists
const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Create placeholder files
IMAGES.forEach(image => {
  const filePath = path.join(imagesDir, image);
  const name = path.basename(image, path.extname(image));
  
  // If the file doesn't exist, create a placeholder
  if (!fs.existsSync(filePath)) {
    const svgFilePath = filePath.replace(/\.[^.]+$/, '.svg');
    const svg = createPlaceholderSVG(name);
    
    fs.writeFileSync(svgFilePath, svg);
    console.log(`Created placeholder for ${image} at ${svgFilePath}`);
  } else {
    console.log(`File ${filePath} already exists, skipping`);
  }
});

console.log('Placeholder creation complete!'); 