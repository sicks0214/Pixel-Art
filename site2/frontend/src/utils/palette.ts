import { PaletteData, Color } from '@/store/colorWeaverStore'

export interface PaletteAnalysis {
  brightness: number // 0-100
  saturation: number // 0-100
  warmth: number // 0-100 (越大越暖)
  avgHue: number // 0-360
  styleTags: string[]
}

// ---------- 基础色彩转换 ----------
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  return { r, g, b }
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360
  s /= 100
  l /= 100
  if (s === 0) {
    const gray = Math.round(l * 255)
    return { r: gray, g: gray, b: gray }
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = hue2rgb(p, q, h + 1 / 3)
  const g = hue2rgb(p, q, h)
  const b = hue2rgb(p, q, h - 1 / 3)
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

// ---------- 调整算法 ----------
export function adjustPalette(
  colors: Color[],
  { brightness = 0, saturation = 0, warmth = 0 }: { brightness?: number; saturation?: number; warmth?: number }
): Color[] {
  return colors.map((c) => {
    const { r, g, b } = hexToRgb(c.hex)
    const hsl = rgbToHsl(r, g, b)
    
    // 色调调整：warmth调整范围更合理（-30到+30度）
    const hueShift = (warmth / 50) * 30 // 将-50到+50映射到-30到+30度
    const newH = (hsl.h + hueShift + 360) % 360
    
    // 饱和度调整：更温和的调整
    const saturationShift = (saturation / 50) * 30 // 将-50到+50映射到-30到+30
    const newS = clamp(hsl.s + saturationShift, 0, 100)
    
    // 亮度调整：更温和的调整
    const brightnessShift = (brightness / 50) * 30 // 将-50到+50映射到-30到+30
    const newL = clamp(hsl.l + brightnessShift, 5, 95) // 避免纯黑或纯白
    
    const hex = hslToHex(newH, newS, newL)
    return { 
      ...c, 
      hex, 
      hsl: { h: Math.round(newH), s: Math.round(newS), l: Math.round(newL) }, 
      rgb: hslToRgb(newH, newS, newL) 
    }
  })
}

// ---------- 分析与归类 ----------
export function analyzePalette(colors: Color[]): PaletteAnalysis {
  if (colors.length === 0) {
    return { brightness: 0, saturation: 0, warmth: 0, avgHue: 0, styleTags: [] }
  }
  const hsls = colors.map((c) => {
    if (c.hsl) return c.hsl
    const { r, g, b } = c.rgb || hexToRgb(c.hex)
    return rgbToHsl(r, g, b)
  })
  const avg = hsls.reduce((acc, h) => ({ h: acc.h + h.h, s: acc.s + h.s, l: acc.l + h.l }), { h: 0, s: 0, l: 0 })
  const avgHue = Math.round(avg.h / hsls.length)
  const brightness = Math.round(avg.l / hsls.length)
  const saturation = Math.round(avg.s / hsls.length)
  const warmthRatio = hsls.filter((h) => h.h <= 60 || h.h >= 300).length / hsls.length
  const warmth = Math.round(warmthRatio * 100)

  const styleTags: string[] = []
  if (brightness >= 70) styleTags.push('亮色')
  if (saturation >= 60) styleTags.push('活力')
  if (avgHue >= 80 && avgHue <= 160) styleTags.push('绿色')
  if (avgHue >= 20 && avgHue <= 60) styleTags.push('温暖')
  if (avgHue >= 200 && avgHue <= 260) styleTags.push('冷静')
  if (styleTags.length === 0) styleTags.push('自然')

  return { brightness, saturation, warmth, avgHue, styleTags }
}

// ---------- 从输入快速生成调色板 ----------
export function generatePaletteFromInput(input: string): PaletteData {
  const text = input.trim()
  const hexMatch = text.match(/^#?[0-9a-fA-F]{6}$/)

  if (hexMatch) {
    const base = text.startsWith('#') ? text.toUpperCase() : `#${text.toUpperCase()}`
    const { r, g, b } = hexToRgb(base)
    const hsl = rgbToHsl(r, g, b)
    const names = ['Base', 'Light', 'Dark', 'Accent', 'Muted']
    const roles: Color['role'][] = ['primary', 'secondary', 'accent', 'success', 'warning']
    const variants = [
      { b: 0, s: 0, w: 0 },
      { b: 15, s: -5, w: 0 },
      { b: -15, s: 5, w: 0 },
      { b: 5, s: 10, w: 10 },
      { b: -5, s: -10, w: -10 }
    ]
    const colors: Color[] = variants.map((v, i) => {
      const hex = hslToHex((hsl.h + v.w + 360) % 360, clamp(hsl.s + v.s, 0, 100), clamp(hsl.l + v.b, 0, 100))
      return { hex, name: names[i], role: roles[i], rgb: hexToRgb(hex), hsl: rgbToHsl(hexToRgb(hex).r, hexToRgb(hex).g, hexToRgb(hex).b) }
    })
    return {
      name: 'Custom Base Palette',
      description: '基于输入HEX生成的配色变体',
      colors,
      usageGuide: { primary: '主色', secondary: '辅色', accent: '强调色' }
    }
  }

  // 已移除本地关键词特化（统一依赖后端 AI）。

  // 默认主题：根据关键词推断色相
  const hash = Array.from(text).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const baseHue = hash % 360
  const baseHex = hslToHex(baseHue, 70, 50)
  const scheme = adjustPalette(
    [
      { hex: baseHex, name: 'Primary', role: 'primary' },
      { hex: hslToHex((baseHue + 30) % 360, 65, 55), name: 'Secondary', role: 'secondary' },
      { hex: hslToHex((baseHue + 300) % 360, 70, 55), name: 'Accent', role: 'accent' },
      { hex: hslToHex((baseHue + 120) % 360, 60, 45), name: 'Success', role: 'success' },
      { hex: hslToHex((baseHue + 210) % 360, 70, 60), name: 'Warning', role: 'warning' }
    ] as Color[],
    { brightness: 0, saturation: 0, warmth: 0 }
  )

  return {
    name: text,
    description: '基于关键词自动生成的智能调色板',
    colors: scheme.map((c) => ({ ...c, rgb: hexToRgb(c.hex), hsl: rgbToHsl(hexToRgb(c.hex).r, hexToRgb(c.hex).g, hexToRgb(c.hex).b) })),
    usageGuide: { primary: '主色', secondary: '辅色', accent: '强调色' }
  }
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const srgb = [r, g, b].map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const L1 = relativeLuminance(foregroundHex)
  const L2 = relativeLuminance(backgroundHex)
  const light = Math.max(L1, L2)
  const dark = Math.min(L1, L2)
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100
}

export function wcagLevel(foregroundHex: string, backgroundHex: string, fontSizePx: number = 16): 'AAA' | 'AA' | 'Fail' {
  const ratio = contrastRatio(foregroundHex, backgroundHex)
  const isLarge = fontSizePx >= 24
  if ((isLarge && ratio >= 4.5) || (!isLarge && ratio >= 7)) return 'AAA'
  if ((isLarge && ratio >= 3) || (!isLarge && ratio >= 4.5)) return 'AA'
  return 'Fail'
} 