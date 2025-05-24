// Helper functions for color interpolation
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result || result.length < 4) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: parseInt(result[1] ?? "0", 16),
    g: parseInt(result[2] ?? "0", 16),
    b: parseInt(result[3] ?? "0", 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function interpolateColor(
  color1: string | undefined,
  color2: string | undefined,
  factor: number
): string {
  // Use default colors if undefined
  const safeColor1 = color1 || "#3b82f6";
  const safeColor2 = color2 || "#ef4444";

  const rgb1 = hexToRgb(safeColor1);
  const rgb2 = hexToRgb(safeColor2);

  const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
  const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
  const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));

  return rgbToHex(r, g, b);
}
