/**
 * 🔄 COLOR03 前端版状态管理（重定向到统一状态管理）
 * 保持向后兼容，内部使用新的统一状态管理
 */

// 重定向到兼容层
export { 
  useFrontendPixelArtStore,
  useProcessingState,
  useFileState,
  useResultState,
  useParametersState,
  usePreviewState,
  useBatchState,
  STYLE_PRESETS
} from './pixelArtStoreCompat'

// 保持类型兼容
export type {
  StylePreset
} from './unifiedPixelArtStore' 