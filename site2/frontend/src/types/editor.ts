/**
 * 编辑器相关类型定义
 */

// 文字元素
export interface TextElement {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily?: string
  color: string
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'
  textDecoration?: 'none' | 'underline' | 'line-through'
  strokeColor?: string
  strokeWidth?: number
  shadow?: TextShadow
  rotation?: number
  opacity?: number
  visible?: boolean
  zIndex?: number
}

// 文字阴影
export interface TextShadow {
  offsetX: number
  offsetY: number
  blur: number
  color: string
}

// 画布尺寸
export interface CanvasDimensions {
  width: number
  height: number
  scale?: number
}

// 编辑器工具类型
export type EditorTool = 
  | 'select'
  | 'text'
  | 'brush'
  | 'eraser'
  | 'shape'
  | 'crop'
  | 'filter'
  | 'move'
  | 'resize'

// 编辑器状态
export interface EditorState {
  tool: EditorTool
  isEditing: boolean
  selectedElementId?: string
  canvas: CanvasDimensions
  zoom: number
  textElements: TextElement[]
  history: EditorAction[]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
}

// 编辑器操作
export interface EditorAction {
  id: string
  type: ActionType
  data: any
  timestamp: number
  description?: string
}

// 操作类型
export type ActionType = 
  | 'ADD_TEXT'
  | 'UPDATE_TEXT'
  | 'DELETE_TEXT'
  | 'MOVE_ELEMENT'
  | 'RESIZE_ELEMENT'
  | 'CHANGE_STYLE'
  | 'APPLY_FILTER'
  | 'CROP_IMAGE'
  | 'TRANSFORM_IMAGE'
  | 'CLEAR_ALL'

// 滤镜类型
export type FilterType = 
  | 'none'
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'grayscale'
  | 'sepia'
  | 'invert'
  | 'hue-rotate'
  | 'saturate'
  | 'vintage'
  | 'warm'
  | 'cool'

// 滤镜参数
export interface FilterParams {
  type: FilterType
  intensity: number // 0-100
  customParams?: Record<string, number>
}

// 图形形状
export interface ShapeElement {
  id: string
  type: 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow'
  x: number
  y: number
  width: number
  height: number
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  rotation?: number
  opacity?: number
  visible?: boolean
  zIndex?: number
}

// 画笔设置
export interface BrushSettings {
  size: number
  color: string
  opacity: number
  hardness: number
  type: 'round' | 'square' | 'custom'
}

// 橡皮擦设置
export interface EraserSettings {
  size: number
  opacity: number
  type: 'soft' | 'hard'
}

// 编辑器配置
export interface EditorConfig {
  maxHistorySize: number
  autoSave: boolean
  autoSaveInterval: number // 秒
  defaultTextStyle: Partial<TextElement>
  defaultCanvasSize: CanvasDimensions
  allowedTools: EditorTool[]
  maxZoom: number
  minZoom: number
}

// 选择区域
export interface SelectionArea {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

// 变换手柄
export interface TransformHandle {
  type: 'corner' | 'edge' | 'rotation'
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right' | 'rotation'
  x: number
  y: number
  cursor: string
} 