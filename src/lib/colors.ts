export function getContrastColor(hexColor: string): string {
  if (!hexColor) return '#ffffff';
  
  // Handle hex colors
  if (hexColor.startsWith('#')) {
    const hex = hexColor.replace('#', '');
    // Handle shorthand hex like #000
    const fullHex = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    
    const r = parseInt(fullHex.substr(0, 2), 16);
    const g = parseInt(fullHex.substr(2, 2), 16);
    const b = parseInt(fullHex.substr(4, 2), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '#ffffff';

    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  }
  
  // Fallback for other color formats
  return '#ffffff'; 
}