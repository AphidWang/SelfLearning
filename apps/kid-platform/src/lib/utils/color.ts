/**
 * 顏色工具函數
 */

/**
 * 將 hex 顏色轉換為 HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  // 移除 # 符號
  const cleanHex = hex.replace('#', '');
  
  // 解析 RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // 無色
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * 將 HSL 轉換為 hex
 */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * 將顏色變淺（類似 Tailwind 的 -100 色階）
 * 增加亮度，降低飽和度
 */
export function lightenColor(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return '#f9fafb'; // 預設淺灰背景

  // 設定為類似 Tailwind -100 的淺色版本
  // 亮度設為 95-98%（非常淺）
  const newLightness = Math.min(98, Math.max(95, 95 + (100 - hsl.l) * 0.1));
  // 飽和度降低到 5-15%（非常淡）
  const newSaturation = Math.max(5, Math.min(15, hsl.s * 0.15));

  return hslToHex(hsl.h, newSaturation, newLightness);
}
