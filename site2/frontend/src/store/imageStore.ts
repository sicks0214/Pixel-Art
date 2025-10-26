import { create } from 'zustand'

interface ImageData {
  file: File
  url: string
  name: string
  size: number
  type: string
}

interface ProcessedImage {
  url: string
  processed: boolean
}

interface ImageState {
  image: ImageData | null
  processedImage: ProcessedImage | null
  processingStatus: 'idle' | 'uploading' | 'processing' | 'uploaded' | 'processed' | 'error'
  
  // Actions
  setImage: (image: ImageData) => void
  setProcessedImage: (processed: ProcessedImage) => void
  setProcessingStatus: (status: ImageState['processingStatus']) => void
  clearImages: () => void
}

export const useImageStore = create<ImageState>((set) => ({
  image: null,
  processedImage: null,
  processingStatus: 'idle',
  
  setImage: (image) => set({ image }),
  setProcessedImage: (processed) => set({ processedImage: processed }),
  setProcessingStatus: (status) => set({ processingStatus: status }),
  clearImages: () => set({ 
    image: null, 
    processedImage: null, 
    processingStatus: 'idle' 
  }),
})) 