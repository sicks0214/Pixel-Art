/**
 * 像素取色自定义Hook
 * 功能: 实现精确的像素级颜色选择，支持图片上的点击取色
 */

import { useState, useCallback, useRef } from 'react';
import { Color, Point } from '../types/colorAnalysis';

interface UsePixelPickerOptions {
  imageElement?: HTMLImageElement | null;
  onColorPick?: (color: Color, position: Point) => void;
  onError?: (error: Error) => void;
}

interface UsePixelPickerReturn {
  // 状态
  isActive: boolean;
  currentColor: Color | null;
  currentPosition: Point | null;
  error: string | null;
  
  // 方法
  pickColor: (position: Point) => Promise<Color | null>;
  pickColorFromCanvas: (canvas: HTMLCanvasElement, position: Point) => Promise<Color | null>;
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  reset: () => void;
}

// RGB到HSL转换
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // 灰色
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

  return { h: h * 360, s: s * 100, l: l * 100 };
};

// RGB到十六进制转换
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// 生成颜色名称（简化版）
const generateColorName = (rgb: { r: number; g: number; b: number }): string => {
  const { r, g, b } = rgb;
  const hsl = rgbToHsl(r, g, b);
  
  // 基于HSL值生成颜色名称
  const hue = hsl.h;
  const saturation = hsl.s;
  const lightness = hsl.l;
  
  // 判断基本颜色
  let baseName = '';
  if (saturation < 10) {
    if (lightness < 20) baseName = 'Dark Gray';
    else if (lightness < 40) baseName = 'Gray';
    else if (lightness < 60) baseName = 'Light Gray';
    else if (lightness < 80) baseName = 'Very Light Gray';
    else baseName = 'White';
  } else {
    if (hue < 15 || hue >= 345) baseName = 'Red';
    else if (hue < 45) baseName = 'Orange';
    else if (hue < 75) baseName = 'Yellow';
    else if (hue < 105) baseName = 'Yellow Green';
    else if (hue < 135) baseName = 'Green';
    else if (hue < 165) baseName = 'Blue Green';
    else if (hue < 195) baseName = 'Cyan';
    else if (hue < 225) baseName = 'Blue';
    else if (hue < 255) baseName = 'Blue Violet';
    else if (hue < 285) baseName = 'Violet';
    else if (hue < 315) baseName = 'Red Violet';
    else baseName = 'Red';
    
    // 添加亮度修饰符
    if (lightness < 30) baseName = `Dark ${baseName}`;
    else if (lightness > 70) baseName = `Light ${baseName}`;
  }
  
  return baseName;
};

// 验证位置是否在图片范围内
const validatePosition = (position: Point, imageElement: HTMLImageElement): boolean => {
  return position.x >= 0 && 
         position.x < imageElement.naturalWidth && 
         position.y >= 0 && 
         position.y < imageElement.naturalHeight;
};

export const usePixelPicker = (options: UsePixelPickerOptions = {}): UsePixelPickerReturn => {
  const {
    imageElement,
    onColorPick,
    onError
  } = options;

  // 状态
  const [isActive, setIsActive] = useState(false);
  const [currentColor, setCurrentColor] = useState<Color | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Point | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Canvas引用用于颜色提取
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 从Canvas的指定位置提取颜色
  const pickColorFromCanvas = useCallback(async (
    canvas: HTMLCanvasElement, 
    position: Point
  ): Promise<Color | null> => {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // 确保位置在canvas范围内
      const x = Math.max(0, Math.min(Math.floor(position.x), canvas.width - 1));
      const y = Math.max(0, Math.min(Math.floor(position.y), canvas.height - 1));

      // 获取像素数据
      const imageData = ctx.getImageData(x, y, 1, 1);
      const [r, g, b, alpha] = imageData.data;

      // 检查透明度
      if (alpha < 128) {
        throw new Error('Transparent pixel selected');
      }

      // 创建颜色对象
      const rgb = { r, g, b };
      const hsl = rgbToHsl(r, g, b);
      const hex = rgbToHex(r, g, b);
      const name = generateColorName(rgb);

      const color: Color = {
        hex,
        rgb,
        hsl,
        name,
        type: 'manual'
      };

      return color;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to pick color');
      setError(error.message);
      onError?.(error);
      return null;
    }
  }, [onError]);

  // 主要的颜色拾取方法
  const pickColor = useCallback(async (position: Point): Promise<Color | null> => {
    if (!imageElement) {
      const error = new Error('No image element provided');
      setError(error.message);
      onError?.(error);
      return null;
    }

    setError(null);

    try {
      // 验证位置
      if (!validatePosition(position, imageElement)) {
        throw new Error('Position is outside image bounds');
      }

      // 创建或获取canvas
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // 设置canvas尺寸为图片的原始尺寸
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      // 绘制图片
      ctx.drawImage(imageElement, 0, 0);

      // 提取颜色
      const color = await pickColorFromCanvas(canvas, position);
      
      if (color) {
        setCurrentColor(color);
        setCurrentPosition(position);
        onColorPick?.(color, position);
      }

      return color;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to pick color');
      setError(error.message);
      onError?.(error);
      return null;
    }
  }, [imageElement, pickColorFromCanvas, onColorPick, onError]);

  // 激活取色器
  const activate = useCallback(() => {
    setIsActive(true);
    setError(null);
  }, []);

  // 停用取色器
  const deactivate = useCallback(() => {
    setIsActive(false);
  }, []);

  // 切换取色器状态
  const toggle = useCallback(() => {
    setIsActive(prev => !prev);
    if (isActive) {
      setError(null);
    }
  }, [isActive]);

  // 重置状态
  const reset = useCallback(() => {
    setCurrentColor(null);
    setCurrentPosition(null);
    setError(null);
    setIsActive(false);
  }, []);

  return {
    isActive,
    currentColor,
    currentPosition,
    error,
    pickColor,
    pickColorFromCanvas,
    activate,
    deactivate,
    toggle,
    reset
  };
}; 