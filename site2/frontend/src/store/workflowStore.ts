import { create } from 'zustand'
import type { 
  ProcessingStep,
  WorkflowState,
  CartoonifyConfig,
  PurifyConfig,
  TextConfig,
  StickerElement,
  RecommendedText,
  ProcessingResult
} from '@/types/workflow'

interface WorkflowStore extends WorkflowState {
  // 基本流程控制
  setCurrentStep: (step: ProcessingStep) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: ProcessingStep) => void
  
  // 图片处理
  setOriginalImage: (image: string) => void
  setProcessedImage: (image: string) => void
  
  // 卡通化模块
  enableCartoonify: (enabled: boolean) => void
  updateCartoonifyConfig: (config: Partial<CartoonifyConfig>) => void
  setCartoonifyResult: (result: ProcessingResult) => void
  
  // 图像净化模块
  enablePurify: (enabled: boolean) => void
  updatePurifyConfig: (config: Partial<PurifyConfig>) => void
  setPurifyResult: (result: ProcessingResult) => void
  
  // 文本模块
  enableText: (enabled: boolean) => void
  addTextElement: (text: TextConfig) => void
  updateTextElement: (index: number, text: Partial<TextConfig>) => void
  removeTextElement: (index: number) => void
  setRecommendedTexts: (texts: RecommendedText[]) => void
  
  // 贴纸模块
  enableStickers: (enabled: boolean) => void
  addStickerElement: (sticker: StickerElement) => void
  updateStickerElement: (id: string, updates: Partial<StickerElement>) => void
  removeStickerElement: (id: string) => void
  setAvailableStickers: (stickers: StickerElement[]) => void
  
  // 画布操作
  updateCanvas: (updates: Partial<WorkflowState['canvas']>) => void
  setCompositeImage: (image: string) => void
  
  // 导出操作
  updateExportConfig: (config: Partial<WorkflowState['export']>) => void
  
  // 重置和清理
  reset: () => void
  resetModule: (module: keyof WorkflowState['modules']) => void
}

// 默认配置
const defaultCartoonifyConfig: CartoonifyConfig = {
  style: 'anime',
  intensity: 70,
  edgeStrength: 50,
  colorReduction: 30
}

const defaultPurifyConfig: PurifyConfig = {
  skinSmoothing: 50,
  blemishRemoval: true,
  eyeEnhancement: false,
  teethWhitening: false,
  wrinkleReduction: 30
}

const defaultRecommendedTexts: RecommendedText[] = [
  {
    id: '1',
    category: 'funny',
    content: '今天心情很好呢 🌈',
    style: {
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#ff6b6b',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    popular: true
  },
  {
    id: '2',
    category: 'cute',
    content: '可爱到爆炸 💕',
    style: {
      fontSize: 20,
      fontFamily: 'Arial',
      color: '#ff9ff3',
      fontWeight: 'normal',
      textAlign: 'center'
    },
    popular: true
  },
  {
    id: '3',
    category: 'cool',
    content: '超酷的我 😎',
    style: {
      fontSize: 22,
      fontFamily: 'Arial',
      color: '#74c0fc',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    popular: false
  }
]

const stepOrder: ProcessingStep[] = [
  'upload', 'center', 'cartoonify', 'purify', 'text', 'stickers', 'canvas', 'export'
]

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // 初始状态
  currentStep: 'upload',
  originalImage: null,
  processedImage: null,
  
  modules: {
    cartoonify: {
      enabled: false,
      config: defaultCartoonifyConfig
    },
    purify: {
      enabled: false,
      config: defaultPurifyConfig
    },
    text: {
      enabled: false,
      elements: [],
      recommended: defaultRecommendedTexts
    },
    stickers: {
      enabled: false,
      elements: [],
      availableStickers: []
    }
  },
  
  canvas: {
    width: 800,
    height: 600,
    scale: 1
  },
  
  export: {
    formats: ['png', 'webp'],
    quality: 90
  },
  
  // 基本流程控制
  setCurrentStep: (step) => set({ currentStep: step }),
  
  nextStep: () => {
    const { currentStep } = get()
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      set({ currentStep: stepOrder[currentIndex + 1] })
    }
  },
  
  previousStep: () => {
    const { currentStep } = get()
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      set({ currentStep: stepOrder[currentIndex - 1] })
    }
  },
  
  goToStep: (step) => set({ currentStep: step }),
  
  // 图片处理
  setOriginalImage: (image) => set({ originalImage: image }),
  setProcessedImage: (image) => set({ processedImage: image }),
  
  // 卡通化模块
  enableCartoonify: (enabled) => set((state) => ({
    modules: {
      ...state.modules,
      cartoonify: {
        ...state.modules.cartoonify,
        enabled
      }
    }
  })),
  
  updateCartoonifyConfig: (config) => set((state) => ({
    modules: {
      ...state.modules,
      cartoonify: {
        ...state.modules.cartoonify,
        config: {
          ...state.modules.cartoonify.config,
          ...config
        }
      }
    }
  })),
  
  setCartoonifyResult: (result) => set((state) => ({
    modules: {
      ...state.modules,
      cartoonify: {
        ...state.modules.cartoonify,
        result
      }
    }
  })),
  
  // 图像净化模块
  enablePurify: (enabled) => set((state) => ({
    modules: {
      ...state.modules,
      purify: {
        ...state.modules.purify,
        enabled
      }
    }
  })),
  
  updatePurifyConfig: (config) => set((state) => ({
    modules: {
      ...state.modules,
      purify: {
        ...state.modules.purify,
        config: {
          ...state.modules.purify.config,
          ...config
        }
      }
    }
  })),
  
  setPurifyResult: (result) => set((state) => ({
    modules: {
      ...state.modules,
      purify: {
        ...state.modules.purify,
        result
      }
    }
  })),
  
  // 文本模块
  enableText: (enabled) => set((state) => ({
    modules: {
      ...state.modules,
      text: {
        ...state.modules.text,
        enabled
      }
    }
  })),
  
  addTextElement: (text) => set((state) => ({
    modules: {
      ...state.modules,
      text: {
        ...state.modules.text,
        elements: [...state.modules.text.elements, text]
      }
    }
  })),
  
  updateTextElement: (index, updates) => set((state) => ({
    modules: {
      ...state.modules,
      text: {
        ...state.modules.text,
        elements: state.modules.text.elements.map((element, i) =>
          i === index ? { ...element, ...updates } : element
        )
      }
    }
  })),
  
  removeTextElement: (index) => set((state) => ({
    modules: {
      ...state.modules,
      text: {
        ...state.modules.text,
        elements: state.modules.text.elements.filter((_, i) => i !== index)
      }
    }
  })),
  
  setRecommendedTexts: (texts) => set((state) => ({
    modules: {
      ...state.modules,
      text: {
        ...state.modules.text,
        recommended: texts
      }
    }
  })),
  
  // 贴纸模块
  enableStickers: (enabled) => set((state) => ({
    modules: {
      ...state.modules,
      stickers: {
        ...state.modules.stickers,
        enabled
      }
    }
  })),
  
  addStickerElement: (sticker) => set((state) => ({
    modules: {
      ...state.modules,
      stickers: {
        ...state.modules.stickers,
        elements: [...state.modules.stickers.elements, sticker]
      }
    }
  })),
  
  updateStickerElement: (id, updates) => set((state) => ({
    modules: {
      ...state.modules,
      stickers: {
        ...state.modules.stickers,
        elements: state.modules.stickers.elements.map((element) =>
          element.id === id ? { ...element, ...updates } : element
        )
      }
    }
  })),
  
  removeStickerElement: (id) => set((state) => ({
    modules: {
      ...state.modules,
      stickers: {
        ...state.modules.stickers,
        elements: state.modules.stickers.elements.filter((element) => element.id !== id)
      }
    }
  })),
  
  setAvailableStickers: (stickers) => set((state) => ({
    modules: {
      ...state.modules,
      stickers: {
        ...state.modules.stickers,
        availableStickers: stickers
      }
    }
  })),
  
  // 画布操作
  updateCanvas: (updates) => set((state) => ({
    canvas: {
      ...state.canvas,
      ...updates
    }
  })),
  
  setCompositeImage: (image) => set((state) => ({
    canvas: {
      ...state.canvas,
      compositeImage: image
    }
  })),
  
  // 导出操作
  updateExportConfig: (config) => set((state) => ({
    export: {
      ...state.export,
      ...config
    }
  })),
  
  // 重置和清理
  reset: () => set({
    currentStep: 'upload',
    originalImage: null,
    processedImage: null,
    modules: {
      cartoonify: {
        enabled: false,
        config: defaultCartoonifyConfig
      },
      purify: {
        enabled: false,
        config: defaultPurifyConfig
      },
      text: {
        enabled: false,
        elements: [],
        recommended: defaultRecommendedTexts
      },
      stickers: {
        enabled: false,
        elements: [],
        availableStickers: []
      }
    },
    canvas: {
      width: 800,
      height: 600,
      scale: 1
    },
    export: {
      formats: ['png', 'webp'],
      quality: 90
    }
  }),
  
  resetModule: (module) => set((state) => {
    const newModules = { ...state.modules }
    
    switch (module) {
      case 'cartoonify':
        newModules.cartoonify = {
          enabled: false,
          config: defaultCartoonifyConfig
        }
        break
      case 'purify':
        newModules.purify = {
          enabled: false,
          config: defaultPurifyConfig
        }
        break
      case 'text':
        newModules.text = {
          enabled: false,
          elements: [],
          recommended: defaultRecommendedTexts
        }
        break
      case 'stickers':
        newModules.stickers = {
          enabled: false,
          elements: [],
          availableStickers: []
        }
        break
    }
    
    return { modules: newModules }
  })
})) 