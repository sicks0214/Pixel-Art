/**
 * 旋转助手工具 - 独立旋转功能模块
 * 提供角度计算、约束和格式化功能
 */

export interface RotationState {
  isRotating: boolean
  startAngle: number
  currentAngle: number
  centerX: number
  centerY: number
}

export interface RotationConstraints {
  snapToAngles?: number[]  // 吸附角度，如 [0, 45, 90, 135, 180, 225, 270, 315]
  snapThreshold?: number   // 吸附阈值（度）
  minAngle?: number       // 最小角度
  maxAngle?: number       // 最大角度
}

/**
 * 计算鼠标位置相对于元素中心的角度
 * @param mouseX 鼠标X坐标
 * @param mouseY 鼠标Y坐标
 * @param centerX 元素中心X坐标
 * @param centerY 元素中心Y坐标
 * @returns 角度（度，0-360）
 */
export const calculateAngleFromCenter = (
  mouseX: number,
  mouseY: number,
  centerX: number,
  centerY: number
): number => {
  const deltaX = mouseX - centerX
  const deltaY = mouseY - centerY
  
  // 使用 atan2 计算角度，范围是 -π 到 π
  let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
  
  // 转换为 0-360 度范围
  if (angle < 0) {
    angle += 360
  }
  
  return angle
}

/**
 * 计算旋转角度差值
 * @param startAngle 起始角度
 * @param currentAngle 当前角度
 * @returns 角度差值
 */
export const calculateRotationDelta = (startAngle: number, currentAngle: number): number => {
  let delta = currentAngle - startAngle
  
  // 处理跨越0度的情况
  if (delta > 180) {
    delta -= 360
  } else if (delta < -180) {
    delta += 360
  }
  
  return delta
}

/**
 * 应用角度约束和吸附
 * @param angle 原始角度
 * @param constraints 约束配置
 * @returns 约束后的角度
 */
export const applyRotationConstraints = (
  angle: number,
  constraints: RotationConstraints = {}
): number => {
  let constrainedAngle = angle
  
  // 角度范围约束
  if (constraints.minAngle !== undefined) {
    constrainedAngle = Math.max(constrainedAngle, constraints.minAngle)
  }
  
  if (constraints.maxAngle !== undefined) {
    constrainedAngle = Math.min(constrainedAngle, constraints.maxAngle)
  }
  
  // 角度吸附
  if (constraints.snapToAngles && constraints.snapToAngles.length > 0) {
    const snapThreshold = constraints.snapThreshold || 8
    
    for (const snapAngle of constraints.snapToAngles) {
      const distance = Math.abs(constrainedAngle - snapAngle)
      const wrappedDistance = Math.min(distance, 360 - distance)
      
      if (wrappedDistance <= snapThreshold) {
        constrainedAngle = snapAngle
        break
      }
    }
  }
  
  // 确保角度在 0-360 范围内
  while (constrainedAngle < 0) {
    constrainedAngle += 360
  }
  while (constrainedAngle >= 360) {
    constrainedAngle -= 360
  }
  
  return constrainedAngle
}

/**
 * 标准化角度到 0-360 范围
 * @param angle 原始角度
 * @returns 标准化角度
 */
export const normalizeAngle = (angle: number): number => {
  let normalized = angle % 360
  if (normalized < 0) {
    normalized += 360
  }
  return normalized
}

/**
 * 格式化角度显示
 * @param angle 角度值
 * @param precision 小数位数
 * @returns 格式化字符串
 */
export const formatAngle = (angle: number, precision: number = 1): string => {
  return `${angle.toFixed(precision)}°`
}

/**
 * 检查角度是否有效
 * @param angle 角度值
 * @returns 是否有效
 */
export const isValidAngle = (angle: number): boolean => {
  return typeof angle === 'number' && !isNaN(angle) && isFinite(angle)
}

/**
 * 计算旋转后的点坐标
 * @param x 原始X坐标
 * @param y 原始Y坐标
 * @param centerX 旋转中心X坐标
 * @param centerY 旋转中心Y坐标
 * @param angle 旋转角度（度）
 * @returns 旋转后的坐标
 */
export const rotatePoint = (
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  angle: number
): { x: number; y: number } => {
  const radians = (angle * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  
  const dx = x - centerX
  const dy = y - centerY
  
  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos
  }
}

/**
 * 默认旋转约束配置 - 禁用吸附，1°精度控制
 */
export const DEFAULT_ROTATION_CONSTRAINTS: RotationConstraints = {
  snapToAngles: [], // 🔧 禁用角度吸附：清空吸附角度数组
  snapThreshold: 0, // 🔧 禁用吸附阈值
  minAngle: undefined,
  maxAngle: undefined
}

/**
 * 旋转助手类
 */
export class RotationHelper {
  private constraints: RotationConstraints
  
  constructor(constraints: RotationConstraints = DEFAULT_ROTATION_CONSTRAINTS) {
    this.constraints = constraints
  }
  
  /**
   * 更新约束配置
   */
  updateConstraints(newConstraints: Partial<RotationConstraints>) {
    this.constraints = { ...this.constraints, ...newConstraints }
  }
  
  /**
   * 计算并应用约束的旋转角度
   */
  calculateConstrainedRotation(
    mouseX: number,
    mouseY: number,
    centerX: number,
    centerY: number,
    originalAngle: number = 0
  ): number {
    const currentAngle = calculateAngleFromCenter(mouseX, mouseY, centerX, centerY)
    const newAngle = normalizeAngle(originalAngle + calculateRotationDelta(0, currentAngle))
    return applyRotationConstraints(newAngle, this.constraints)
  }
  
  /**
   * 检查是否接近吸附角度
   */
  isNearSnapAngle(angle: number): boolean {
    if (!this.constraints.snapToAngles) return false
    
    const snapThreshold = this.constraints.snapThreshold || 10
    
    return this.constraints.snapToAngles.some(snapAngle => {
      const distance = Math.abs(angle - snapAngle)
      const wrappedDistance = Math.min(distance, 360 - distance)
      return wrappedDistance <= snapThreshold
    })
  }
} 