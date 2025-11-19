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
  
  return '#ffffff'; 
}

export function hexToRgb(hex: string) {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse shorthand hex
  if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
  }

  const num = parseInt(hex, 16);
  return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
  };
}

export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
      h = s = 0; // achromatic
  } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
  }

  return { 
      h: Math.round(h * 360), 
      s: Math.round(s * 100), 
      l: Math.round(l * 100) 
  };
}

export function getStatusBadgeStyle(baseColor: string, theme: string | undefined) {
  if (!baseColor) return { backgroundColor: '#e2e8f0', color: '#1e293b', border: '1px solid transparent' };
  
  const rgb = hexToRgb(baseColor);
  if (!rgb) return { backgroundColor: baseColor, color: '#ffffff', border: '1px solid transparent' };
  
  const { h, s } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Determine if we are in dark mode
  // If theme is 'system' we ideally check preference, but here we might rely on the app passing the resolved theme
  const isDark = theme === 'dark' || (theme && theme.includes('dark'));
  
  if (isDark) {
      // Dark Theme:
      // Button: Tajam/Gelap/Pekat (Saturated, Darker) -> L ~ 25%
      // Font: Tipis/Terang/Pastel (Light) -> L ~ 90%
      return {
          backgroundColor: `hsl(${h}, ${s}%, 20%)`,
          color: `hsl(${h}, ${s}%, 90%)`,
          border: `1px solid hsl(${h}, ${s}%, 30%)`
      };
  } else {
      // Light Theme:
      // Button: Tipis/Terang/Pastel (Light, Pastel) -> L ~ 93%
      // Font: Tajam/Gelap/Pekat (Sharp, Dark) -> L ~ 25%
      return {
          backgroundColor: `hsl(${h}, ${s}%, 93%)`,
          color: `hsl(${h}, ${s}%, 25%)`,
          border: `1px solid hsl(${h}, ${s}%, 85%)`
      };
  }
}