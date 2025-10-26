import React from 'react'

interface PixelArtViewerProps {
  imageUrl?: string
  className?: string
}

export const PixelArtViewer: React.FC<PixelArtViewerProps> = ({ 
  imageUrl, 
  className = '' 
}) => {
  return (
    <div className={`border-2 border-dashed border-gray-300 rounded-lg ${className}`}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Pixel Art" 
          className="w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          No image to display
        </div>
      )}
    </div>
  )
}

export default PixelArtViewer
