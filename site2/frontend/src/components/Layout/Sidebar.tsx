/**
 * 应用侧边栏组件
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Palette, 
  Sparkles, 
  Settings, 
  HelpCircle,
  ChevronRight 
} from 'lucide-react'

export interface SidebarProps {
  width?: string
}

const Sidebar: React.FC<SidebarProps> = ({ width = '16rem' }) => {
  const location = useLocation()

  const menuItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/workspace', label: '工作台', icon: Palette },
    { path: '/advanced', label: '高级功能', icon: Sparkles },
  ]

  const bottomItems = [
    { path: '/settings', label: '设置', icon: Settings },
    { path: '/help', label: '帮助', icon: HelpCircle },
  ]

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const MenuItem = ({ path, label, icon: Icon }: { path: string; label: string; icon: React.ElementType }) => (
    <Link
      to={path}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200
        ${isActive(path) 
          ? 'bg-purple-100 text-purple-700 font-medium' 
          : 'text-gray-700 hover:bg-gray-100'
        }
      `}
    >
      <Icon size={20} />
      <span className="flex-1">{label}</span>
      {isActive(path) && <ChevronRight size={16} />}
    </Link>
  )

  return (
    <aside 
      className="bg-white border-r border-gray-200 flex flex-col"
      style={{ width }}
    >
      {/* 主菜单 */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <MenuItem key={item.path} {...item} />
          ))}
        </div>
      </nav>

      {/* 底部菜单 */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-1">
          {bottomItems.map((item) => (
            <MenuItem key={item.path} {...item} />
          ))}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar 