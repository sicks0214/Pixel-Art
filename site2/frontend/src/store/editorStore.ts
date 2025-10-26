import { create } from 'zustand'
import type { 
  TextElement, 
  EditorTool, 
  EditorAction,
  CanvasDimensions 
} from '@/types/editor'

interface EditorState {
  // 编辑器基本状态
  tool: EditorTool
  isEditing: boolean
  selectedElementId: string | null
  canvas: CanvasDimensions
  zoom: number
  
  // 文字元素
  textElements: TextElement[]
  
  // 历史记录
  canUndo: boolean
  canRedo: boolean
  history: EditorAction[]
  historyIndex: number
  
  // 基本Actions
  setTool: (tool: EditorTool) => void
  setIsEditing: (editing: boolean) => void
  setSelectedElementId: (id: string | null) => void
  setZoom: (zoom: number) => void
  setCanvas: (canvas: CanvasDimensions) => void
  
  // 文字元素Actions
  addTextElement: (element: TextElement) => void
  updateTextElement: (id: string, updates: Partial<TextElement>) => void
  deleteTextElement: (id: string) => void
  clearTextElements: () => void
  
  // 历史记录Actions
  undo: () => void
  redo: () => void
  reset: () => void
  addToHistory: (action: EditorAction) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // 初始状态
  tool: 'select',
  isEditing: false,
  selectedElementId: null,
  canvas: { width: 800, height: 600, scale: 1 },
  zoom: 1,
  textElements: [],
  canUndo: false,
  canRedo: false,
  history: [],
  historyIndex: -1,
  
  // 基本Actions
  setTool: (tool) => set({ tool }),
  setIsEditing: (isEditing) => set({ isEditing }),
  setSelectedElementId: (selectedElementId) => set({ selectedElementId }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  setCanvas: (canvas) => set({ canvas }),
  
  // 文字元素Actions
  addTextElement: (element) => set((state) => ({
    textElements: [...state.textElements, element]
  })),
  
  updateTextElement: (id, updates) => set((state) => ({
    textElements: state.textElements.map(element =>
      element.id === id ? { ...element, ...updates } : element
    )
  })),
  
  deleteTextElement: (id) => set((state) => ({
    textElements: state.textElements.filter(element => element.id !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
  })),
  
  clearTextElements: () => set({
    textElements: [],
    selectedElementId: null
  }),
  
  // 历史记录Actions
  undo: () => {
    const state = get()
    if (state.canUndo && state.historyIndex > 0) {
      set({
        historyIndex: state.historyIndex - 1,
        canUndo: state.historyIndex - 1 > 0,
        canRedo: true
      })
    }
  },
  
  redo: () => {
    const state = get()
    if (state.canRedo && state.historyIndex < state.history.length - 1) {
      set({
        historyIndex: state.historyIndex + 1,
        canUndo: true,
        canRedo: state.historyIndex + 1 < state.history.length - 1
      })
    }
  },
  
  reset: () => set({
    tool: 'select',
    isEditing: false,
    selectedElementId: null,
    canvas: { width: 800, height: 600, scale: 1 },
    zoom: 1,
    textElements: [],
    canUndo: false,
    canRedo: false,
    history: [],
    historyIndex: -1
  }),
  
  addToHistory: (action) => {
    const state = get()
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(action)
    
    // 限制历史记录数量
    const maxHistorySize = 50
    if (newHistory.length > maxHistorySize) {
      newHistory.shift()
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false
    })
  }
})) 