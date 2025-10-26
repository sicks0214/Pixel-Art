/**
 * 图片编辑自定义Hook
 */

import { useState, useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useImageStore } from '@/store/imageStore'
import { useAppStore } from '@/store/appStore'
import { imageService } from '@/services/imageService'
import type {
  TextElement,
  EditorTool
} from '@/types/editor'
import type { AddTextRequest } from '@/types/api'

interface UseImageEditorOptions {
  onTextAdded?: (textElement: TextElement) => void
  onTextUpdated?: (textElement: TextElement) => void
  onTextDeleted?: (textId: string) => void
  onError?: (error: Error) => void
}

interface UseImageEditorReturn {
  // 状态
  processing: boolean
  error: string | null
  
  // 文字操作
  addText: (text: string, x: number, y: number, style?: Partial<TextElement>) => Promise<void>
  updateText: (textId: string, updates: Partial<TextElement>) => Promise<void>
  deleteText: (textId: string) => Promise<void>
  clearAllTexts: () => Promise<void>
  
  // 工具操作
  setTool: (tool: EditorTool) => void
  getCurrentTool: () => EditorTool
  
  // 历史操作
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  
  // 画布操作
  setZoom: (zoom: number) => void
  resetZoom: () => void
  fitToScreen: () => void
  
  // 实用方法
  reset: () => void
  exportCurrentState: () => any
  importState: (state: any) => void
}

export const useImageEditor = (options: UseImageEditorOptions = {}): UseImageEditorReturn => {
  const {
    onTextAdded,
    onTextUpdated,
    onTextDeleted,
    onError,
  } = options

  // 状态
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Store
  const {
    tool,
    textElements,
    history,
    historyIndex,
    zoom,
    setTool: setEditorTool,
    addTextElement,
    updateTextElement,
    deleteTextElement,
    clearTextElements,
    addToHistory,
    undo: storeUndo,
    redo: storeRedo,
    setZoom: setEditorZoom,
  } = useEditorStore()

  const { image } = useImageStore()
  const { addError } = useAppStore()

  // Refs
  const actionIdCounter = useRef(0)

  /**
   * 生成唯一ID
   */
  const generateId = useCallback(() => {
    return `action-${Date.now()}-${++actionIdCounter.current}`
  }, [])

  /**
   * 处理错误
   */
  const handleError = useCallback((err: Error) => {
    const errorMessage = err.message || '操作失败'
    setError(errorMessage)
    addError(errorMessage, 'error')
    onError?.(err)
    console.error('❌ 编辑器操作错误:', err)
  }, [addError, onError])

  /**
   * 添加文字
   */
  const addText = useCallback(async (
    text: string,
    x: number,
    y: number,
    style: Partial<TextElement> = {}
  ): Promise<void> => {
    try {
      setError(null)
      setProcessing(true)

      // 创建文字元素
      const textElement: TextElement = {
        id: generateId(),
        text,
        x,
        y,
        fontSize: style.fontSize || 24,
        fontFamily: style.fontFamily || 'Arial',
        color: style.color || '#000000',
        fontWeight: style.fontWeight || 'normal',
        fontStyle: style.fontStyle || 'normal',
        textAlign: style.textAlign || 'left',
        textDecoration: style.textDecoration || 'none',
        strokeColor: style.strokeColor,
        strokeWidth: style.strokeWidth || 0,
        shadow: style.shadow,
        rotation: style.rotation || 0,
        opacity: style.opacity || 1,
        visible: style.visible !== false,
        zIndex: style.zIndex || textElements.length,
      }

      // 添加到Store
      addTextElement(textElement)

      // 构建API请求
      const request: AddTextRequest = {
        text,
        position: { x, y },
        style: {
          fontSize: textElement.fontSize,
          color: textElement.color,
          fontFamily: textElement.fontFamily,
          fontWeight: textElement.fontWeight,
          strokeColor: textElement.strokeColor,
          strokeWidth: textElement.strokeWidth,
        }
      }

      // 调用API添加文字
      const response = await imageService.addText(request)
      if (!response.success) {
        throw new Error(response.error || '添加文字失败')
      }

      // 添加到历史记录
      addToHistory({
        id: generateId(),
        type: 'ADD_TEXT',
        data: textElement,
        timestamp: Date.now(),
        description: `添加文字: "${text}"`,
      })

      console.log('✅ 文字添加成功')
      onTextAdded?.(textElement)
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('添加文字失败'))
    } finally {
      setProcessing(false)
    }
  }, [textElements.length, addTextElement, addToHistory, generateId, handleError, onTextAdded])

  /**
   * 更新文字
   */
  const updateText = useCallback(async (
    textId: string,
    updates: Partial<TextElement>
  ): Promise<void> => {
    try {
      setError(null)
      setProcessing(true)

      // 查找现有文字元素
      const existingElement = textElements.find(el => el.id === textId)
      if (!existingElement) {
        throw new Error('文字元素不存在')
      }

      // 创建更新后的元素
      const updatedElement: TextElement = {
        ...existingElement,
        ...updates,
      }

      // 更新Store
      updateTextElement(textId, updates)

      // 添加到历史记录
      addToHistory({
        id: generateId(),
        type: 'UPDATE_TEXT',
        data: { textId, updates, previous: existingElement },
        timestamp: Date.now(),
        description: `更新文字: "${existingElement.text}"`,
      })

      console.log('✅ 文字更新成功')
      onTextUpdated?.(updatedElement)
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('更新文字失败'))
    } finally {
      setProcessing(false)
    }
  }, [textElements, updateTextElement, addToHistory, generateId, handleError, onTextUpdated])

  /**
   * 删除文字
   */
  const deleteText = useCallback(async (textId: string): Promise<void> => {
    try {
      setError(null)
      setProcessing(true)

      // 查找要删除的元素
      const elementToDelete = textElements.find(el => el.id === textId)
      if (!elementToDelete) {
        throw new Error('文字元素不存在')
      }

      // 从Store删除
      deleteTextElement(textId)

      // 添加到历史记录
      addToHistory({
        id: generateId(),
        type: 'DELETE_TEXT',
        data: { textId, element: elementToDelete },
        timestamp: Date.now(),
        description: `删除文字: "${elementToDelete.text}"`,
      })

      console.log('✅ 文字删除成功')
      onTextDeleted?.(textId)
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('删除文字失败'))
    } finally {
      setProcessing(false)
    }
  }, [textElements, deleteTextElement, addToHistory, generateId, handleError, onTextDeleted])

  /**
   * 清除所有文字
   */
  const clearAllTexts = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      setProcessing(true)

      const elementsToDelete = [...textElements]

      // 调用API清除文字
      const response = await imageService.clearTexts()
      if (!response.success) {
        throw new Error(response.error || '清除文字失败')
      }

      // 清除Store
      clearTextElements()

      // 添加到历史记录
      addToHistory({
        id: generateId(),
        type: 'CLEAR_ALL',
        data: { elements: elementsToDelete },
        timestamp: Date.now(),
        description: '清除所有文字',
      })

      console.log('✅ 所有文字清除成功')
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('清除文字失败'))
    } finally {
      setProcessing(false)
    }
  }, [textElements, clearTextElements, addToHistory, generateId, handleError])



  /**
   * 设置工具
   */
  const setTool = useCallback((newTool: EditorTool) => {
    setEditorTool(newTool)
  }, [setEditorTool])

  /**
   * 获取当前工具
   */
  const getCurrentTool = useCallback(() => {
    return tool
  }, [tool])

  /**
   * 撤销操作
   */
  const undo = useCallback(() => {
    storeUndo()
  }, [storeUndo])

  /**
   * 重做操作
   */
  const redo = useCallback(() => {
    storeRedo()
  }, [storeRedo])

  /**
   * 是否可以撤销
   */
  const canUndo = useCallback(() => {
    return historyIndex > 0
  }, [historyIndex])

  /**
   * 是否可以重做
   */
  const canRedo = useCallback(() => {
    return historyIndex < history.length - 1
  }, [historyIndex, history.length])

  /**
   * 设置缩放
   */
  const setZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(0.1, Math.min(5, newZoom))
    setEditorZoom(clampedZoom)
  }, [setEditorZoom])

  /**
   * 重置缩放
   */
  const resetZoom = useCallback(() => {
    setEditorZoom(1)
  }, [setEditorZoom])

  /**
   * 适应屏幕
   */
  const fitToScreen = useCallback(() => {
    // 根据画布和容器尺寸计算合适的缩放比例
    setEditorZoom(0.8) // 示例值
  }, [setEditorZoom])

  /**
   * 重置编辑器
   */
  const reset = useCallback(() => {
    setProcessing(false)
    setError(null)
    clearTextElements()
    setEditorTool('select')
    setEditorZoom(1)
  }, [clearTextElements, setEditorTool, setEditorZoom])

  /**
   * 导出当前状态
   */
  const exportCurrentState = useCallback(() => {
    return {
      textElements,
      tool,
      zoom,
      history,
      historyIndex,
      timestamp: Date.now(),
    }
  }, [textElements, tool, zoom, history, historyIndex])

  /**
   * 导入状态
   */
  const importState = useCallback((state: any) => {
    try {
      // 验证状态格式
      if (!state || typeof state !== 'object') {
        throw new Error('无效的状态格式')
      }

      // 导入状态（这里需要根据实际的store方法来实现）
      console.log('导入编辑器状态:', state)
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('导入状态失败'))
    }
  }, [handleError])

  return {
    processing,
    error,
    addText,
    updateText,
    deleteText,
    clearAllTexts,
    setTool,
    getCurrentTool,
    undo,
    redo,
    canUndo,
    canRedo,
    setZoom,
    resetZoom,
    fitToScreen,
    reset,
    exportCurrentState,
    importState,
  }
}

export type { UseImageEditorReturn } 