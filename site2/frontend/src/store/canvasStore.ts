/**
 * Canvas核心状态管理 - 第一阶段
 * 管理画布元素、选中状态、历史记录、工具状态等
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// 基础配置接口
export interface CanvasConfig {
  width: number
  height: number
  zoom: number
  backgroundColor: string
  showGrid: boolean
  gridSize: number
  snapToGrid: boolean
  maxZoom: number
  minZoom: number
}

// 🆕 图片库项目接口
export interface ImageItem {
  id: string
  name: string
  src: string
  thumbnail: string
  size: { width: number, height: number }
  uploadTime: Date
  fileSize: number
}

export interface CanvasElement {
  id: string
  type: 'image' | 'text' | 'sticker' | 'bubble' | 'shape'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  zIndex: number
  locked: boolean
  visible: boolean
  style?: 'round' | 'square' | 'thought' | 'shout' | 'whisper' // 气泡样式
  
  // 类型特定属性
  data: {
    // 图片/贴纸
    src?: string
    originalSize?: { width: number, height: number } // 🆕 添加原始尺寸属性
    // 文字
    text?: string
    fontSize?: number
    fontFamily?: string
    fontWeight?: string
    color?: string
    textAlign?: 'left' | 'center' | 'right'
    // 气泡
    bubbleType?: string
    bubbleColor?: string
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    // 形状
    shapeType?: string
    fillColor?: string
    strokeColor?: string
    strokeWidth?: number
  }
}

// 历史记录项
export interface HistoryItem {
  id: string
  timestamp: number
  action: string
  elements: CanvasElement[]
}

// 工具状态
export interface ToolState {
  activeTool: 'select' | 'text' | 'sticker' | 'bubble' | 'shape' | 'upload'
  isDrawing: boolean
  showRulers: boolean
  showGuides: boolean
}

// Canvas Store 状态接口
interface CanvasState {
  // 画布配置
  config: CanvasConfig
  
  // 元素管理
  elements: CanvasElement[]
  selectedElementIds: string[]
  clipboardElements: CanvasElement[]
  
  // 历史管理
  history: HistoryItem[]
  historyIndex: number
  maxHistorySize: number
  
  // 工具状态
  tools: ToolState
  
  // UI状态
  isLoading: boolean
  error: string | null
  
  // 🆕 图片库状态
  imageLibrary: ImageItem[]
  
  // Actions - 元素操作
  addElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  removeElement: (id: string) => void
  removeElements: (ids: string[]) => void
  duplicateElement: (id: string) => void
  
  // Actions - 选择操作
  selectElement: (id: string, multiSelect?: boolean) => void
  selectElements: (ids: string[]) => void
  clearSelection: () => void
  selectAll: () => void
  
  // Actions - 层级操作
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  bringForward: (id: string) => void
  sendBackward: (id: string) => void
  
  // Actions - 剪贴板操作
  copyElements: (ids?: string[]) => void
  cutElements: (ids?: string[]) => void
  pasteElements: () => void
  
  // Actions - 历史操作
  undo: () => void
  redo: () => void
  saveToHistory: (action: string) => void
  clearHistory: () => void
  
  // Actions - 工具操作
  setActiveTool: (tool: ToolState['activeTool']) => void
  toggleGrid: () => void
  toggleRulers: () => void
  toggleGuides: () => void
  
  // Actions - 画布操作
  setCanvasSize: (width: number, height: number) => void
  setZoom: (zoom: number) => void
  resetZoom: () => void
  setBackgroundColor: (color: string) => void
  clearCanvas: () => void
  
  // Actions - 导入导出
  exportCanvas: () => Promise<string>
  importCanvas: (data: string) => void
  
  // 🆕 Actions - 图片库操作
  addToImageLibrary: (image: ImageItem) => void
  removeFromImageLibrary: (id: string) => void
  clearImageLibrary: () => void
}

// 默认画布配置
const defaultConfig: CanvasConfig = {
  width: 1400,
  height: 900,
  backgroundColor: '#ffffff',
  showGrid: true,
  gridSize: 20,
  snapToGrid: true,
  zoom: 1,
  maxZoom: 5,
  minZoom: 0.1
}

// 默认工具状态
const defaultTools: ToolState = {
  activeTool: 'select',
  isDrawing: false,
  showRulers: true,
  showGuides: true
}

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 创建Canvas Store
export const useCanvasStore = create<CanvasState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        config: defaultConfig,
        elements: [],
        selectedElementIds: [],
        clipboardElements: [],
        history: [],
        historyIndex: -1,
        maxHistorySize: 50,
        tools: defaultTools,
        isLoading: false,
        error: null,

        // 🆕 图片库状态
        imageLibrary: [],

        // 元素操作
        addElement: (elementData) => {
          const element: CanvasElement = {
            ...elementData,
            id: generateId(),
            zIndex: get().elements.length
          }
          
          set((state) => ({
            elements: [...state.elements, element],
            selectedElementIds: [element.id]
          }))
          
          get().saveToHistory('添加元素')
        },

        updateElement: (id, updates) => {
          set((state) => ({
            elements: state.elements.map(el => 
              el.id === id ? { ...el, ...updates } : el
            )
          }))
        },

        removeElement: (id) => {
          set((state) => ({
            elements: state.elements.filter(el => el.id !== id),
            selectedElementIds: state.selectedElementIds.filter(selectedId => selectedId !== id)
          }))
          
          get().saveToHistory('删除元素')
        },

        removeElements: (ids) => {
          set((state) => ({
            elements: state.elements.filter(el => !ids.includes(el.id)),
            selectedElementIds: state.selectedElementIds.filter(selectedId => !ids.includes(selectedId))
          }))
          
          get().saveToHistory('删除多个元素')
        },

        duplicateElement: (id) => {
          const element = get().elements.find(el => el.id === id)
          if (element) {
            const duplicated = {
              ...element,
              id: generateId(),
              x: element.x + 20,
              y: element.y + 20,
              zIndex: get().elements.length
            }
            
            set((state) => ({
              elements: [...state.elements, duplicated],
              selectedElementIds: [duplicated.id]
            }))
            
            get().saveToHistory('复制元素')
          }
        },

        // 选择操作
        selectElement: (id, multiSelect = false) => {
          set((state) => ({
            selectedElementIds: multiSelect 
              ? state.selectedElementIds.includes(id)
                ? state.selectedElementIds.filter(selectedId => selectedId !== id)
                : [...state.selectedElementIds, id]
              : [id]
          }))
        },

        selectElements: (ids) => {
          set({ selectedElementIds: ids })
        },

        clearSelection: () => {
          set({ selectedElementIds: [] })
        },

        selectAll: () => {
          set((state) => ({
            selectedElementIds: state.elements.map(el => el.id)
          }))
        },

        // 层级操作
        bringToFront: (id) => {
          const elements = get().elements
          const maxZIndex = Math.max(...elements.map(el => el.zIndex))
          get().updateElement(id, { zIndex: maxZIndex + 1 })
          get().saveToHistory('置于顶层')
        },

        sendToBack: (id) => {
          const elements = get().elements
          const minZIndex = Math.min(...elements.map(el => el.zIndex))
          get().updateElement(id, { zIndex: minZIndex - 1 })
          get().saveToHistory('置于底层')
        },

        bringForward: (id) => {
          const element = get().elements.find(el => el.id === id)
          if (element) {
            get().updateElement(id, { zIndex: element.zIndex + 1 })
            get().saveToHistory('上移一层')
          }
        },

        sendBackward: (id) => {
          const element = get().elements.find(el => el.id === id)
          if (element) {
            get().updateElement(id, { zIndex: element.zIndex - 1 })
            get().saveToHistory('下移一层')
          }
        },

        // 剪贴板操作
        copyElements: (ids) => {
          const targetIds = ids || get().selectedElementIds
          const elementsToCopy = get().elements.filter(el => targetIds.includes(el.id))
          set({ clipboardElements: elementsToCopy })
        },

        cutElements: (ids) => {
          const targetIds = ids || get().selectedElementIds
          get().copyElements(targetIds)
          get().removeElements(targetIds)
        },

        pasteElements: () => {
          const clipboardElements = get().clipboardElements
          if (clipboardElements.length > 0) {
            const newElements = clipboardElements.map(el => ({
              ...el,
              id: generateId(),
              x: el.x + 20,
              y: el.y + 20,
              zIndex: get().elements.length
            }))
            
            set((state) => ({
              elements: [...state.elements, ...newElements],
              selectedElementIds: newElements.map(el => el.id)
            }))
            
            get().saveToHistory('粘贴元素')
          }
        },

        // 历史操作
        undo: () => {
          const { history, historyIndex } = get()
          if (historyIndex > 0) {
            const previousState = history[historyIndex - 1]
            set({
              elements: previousState.elements,
              historyIndex: historyIndex - 1,
              selectedElementIds: []
            })
          }
        },

        redo: () => {
          const { history, historyIndex } = get()
          if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1]
            set({
              elements: nextState.elements,
              historyIndex: historyIndex + 1,
              selectedElementIds: []
            })
          }
        },

        saveToHistory: (action) => {
          const { elements, history, historyIndex, maxHistorySize } = get()
          
          const historyItem: HistoryItem = {
            id: generateId(),
            timestamp: Date.now(),
            action,
            elements: JSON.parse(JSON.stringify(elements)) // 深拷贝
          }
          
          // 移除当前索引后的历史记录
          const newHistory = history.slice(0, historyIndex + 1)
          newHistory.push(historyItem)
          
          // 限制历史记录大小
          if (newHistory.length > maxHistorySize) {
            newHistory.shift()
          }
          
          set({
            history: newHistory,
            historyIndex: newHistory.length - 1
          })
        },

        clearHistory: () => {
          set({
            history: [],
            historyIndex: -1
          })
        },

        // 工具操作
        setActiveTool: (tool) => {
          set((state) => ({
            tools: { ...state.tools, activeTool: tool }
          }))
        },

        toggleGrid: () => {
          set((state) => ({
            config: { ...state.config, showGrid: !state.config.showGrid }
          }))
        },

        toggleRulers: () => {
          set((state) => ({
            tools: { ...state.tools, showRulers: !state.tools.showRulers }
          }))
        },

        toggleGuides: () => {
          set((state) => ({
            tools: { ...state.tools, showGuides: !state.tools.showGuides }
          }))
        },

        // 画布操作
        setCanvasSize: (width, height) => {
          set((state) => ({
            config: { ...state.config, width, height }
          }))
          get().saveToHistory('调整画布大小')
        },

        setZoom: (zoom) => {
          const { minZoom, maxZoom } = get().config
          const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoom))
          set((state) => ({
            config: { ...state.config, zoom: clampedZoom }
          }))
        },

        resetZoom: () => {
          set((state) => ({
            config: { ...state.config, zoom: 1 }
          }))
        },

        setBackgroundColor: (color) => {
          set((state) => ({
            config: { ...state.config, backgroundColor: color }
          }))
          get().saveToHistory('修改背景颜色')
        },

        clearCanvas: () => {
          set({
            elements: [],
            selectedElementIds: []
          })
          get().saveToHistory('清空画布')
        },

        // 导入导出
        exportCanvas: async () => {
          const { elements, config } = get()
          const exportData = {
            elements,
            config,
            version: '1.0.0',
            timestamp: Date.now()
          }
          return JSON.stringify(exportData)
        },

        importCanvas: (data) => {
          try {
            const importData = JSON.parse(data)
            set({
              elements: importData.elements || [],
              config: { ...get().config, ...importData.config },
              selectedElementIds: []
            })
            get().saveToHistory('导入画布')
          } catch (error) {
            console.error('导入画布失败:', error)
            set({ error: '导入画布失败，请检查文件格式' })
          }
        },

        // 🆕 图片库操作
        addToImageLibrary: (image) => {
          set((state) => ({
            imageLibrary: [...state.imageLibrary, image]
          }))
        },

        removeFromImageLibrary: (id) => {
          set((state) => ({
            imageLibrary: state.imageLibrary.filter(img => img.id !== id)
          }))
        },

        clearImageLibrary: () => {
          set({ imageLibrary: [] })
        }
      }),
      {
        name: 'canvas-store',
        partialize: (state) => ({
          config: state.config,
          tools: {
            ...state.tools,
            activeTool: 'select' // 重置为默认工具
          }
        })
      }
    ),
    { name: 'canvas-store' }
  )
) 