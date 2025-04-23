const fs = require('fs');
const path = require('path');

// Ensure the rank-icons directory exists
const iconsDir = path.join(__dirname, '../public/images/rank-icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Define colors for different ranking ranges
const getColorForRanking = (ranking) => {
  if (ranking <= 3) return '#4CAF50'; // Green
  if (ranking <= 7) return '#8BC34A'; // Light Green
  if (ranking <= 10) return '#FFEB3B'; // Yellow
  if (ranking <= 15) return '#FF9800'; // Orange
  if (ranking <= 20) return '#F44336'; // Red
  return '#B71C1C'; // Dark Red
};

// Define text colors
const getTextColorForRanking = (ranking) => {
  if (ranking <= 10 && ranking > 7) return '#000000'; // Black text for yellow background
  return '#FFFFFF'; // White text for all other backgrounds
};

// Create SVG for each ranking
for (let i = 1; i <= 20; i++) {
  const backgroundColor = getColorForRanking(i);
  const textColor = getTextColorForRanking(i);
  const text = i.toString();
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
    <circle cx="15" cy="15" r="15" fill="${backgroundColor}" />
    <text x="15" y="15" font-family="Arial" font-size="16" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${text}</text>
  </svg>`;
  
  fs.writeFileSync(path.join(iconsDir, `${i}.svg`), svg);
}

// Create the 20+ icon
const twentyPlusSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
  <circle cx="15" cy="15" r="15" fill="#B71C1C" />
  <text x="15" y="15" font-family="Arial" font-size="12" font-weight="bold" fill="#FFFFFF" text-anchor="middle" dominant-baseline="central">20+</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, `20+.svg`), twentyPlusSvg);

console.log('Ranking icons created successfully!');
console.log('Now convert SVGs to PNGs using a conversion tool or browser rendering'); 