/**
 * 🔄 COLOR03 服务器版状态管理（重定向到统一状态管理）
 * 保持向后兼容，内部使用新的统一状态管理
 */

// 重定向到兼容层
export { 
  usePixelArtStore,
  INTERPOLATION_OPTIONS,
  COLOR_MODE_OPTIONS
} from './pixelArtStoreCompat'

// 保持类型兼容
export type {
  UploadState,
  ConversionState,
  ResultState,
  FileState,
  ParameterState,
  PixelArtError
} from '../types/pixelArt'

// 保持常量兼容
export {
  DEFAULT_UPLOAD_STATE,
  DEFAULT_CONVERSION_STATE,
  DEFAULT_RESULT_STATE,
  DEFAULT_FILE_STATE,
  DEFAULT_PARAMETER_STATE
} from '../types/pixelArt'
