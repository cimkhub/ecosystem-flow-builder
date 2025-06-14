
export function colorFromString(str: string): string {
  // Generate a hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate HSL color with good saturation and lightness for readability
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
  const lightness = 50 + (Math.abs(hash) % 15); // 50-65%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function getContrastColor(backgroundColor: string): string {
  // Handle hex colors
  if (backgroundColor.startsWith('#')) {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? '#1f2937' : '#ffffff';
  }
  
  // Extract HSL values to determine if we need light or dark text
  const hslMatch = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) {
    const lightness = parseInt(hslMatch[3]);
    return lightness > 60 ? '#1f2937' : '#ffffff';
  }
  return '#1f2937'; // Default to dark text
}
