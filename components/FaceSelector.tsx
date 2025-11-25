import React, { useState, useRef, useEffect } from 'react';
import { Rect } from '../types';

interface FaceSelectorProps {
  imageUrl: string;
  initialRect?: Rect;
  onChange: (rect: Rect) => void;
}

const FaceSelector: React.FC<FaceSelectorProps> = ({ imageUrl, initialRect, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect>(initialRect || { x: 30, y: 20, width: 30, height: 30, shape: 'rect' });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startRect, setStartRect] = useState<Rect | null>(null);
  const [mode, setMode] = useState<'move' | 'resize' | null>(null);

  // Sync internal state if prop changes (e.g. reset)
  useEffect(() => {
    if(initialRect) setRect(initialRect);
  }, [initialRect]);

  const toggleShape = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start
    const newShape: 'rect' | 'circle' = rect.shape === 'circle' ? 'rect' : 'circle';
    const newRect = { ...rect, shape: newShape };
    setRect(newRect);
    onChange(newRect);
  };

  const handleMouseDown = (e: React.MouseEvent, action: 'move' | 'resize') => {
    e.preventDefault();
    setIsDragging(true);
    setMode(action);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartRect({ ...rect });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !startRect) return;

    const container = containerRef.current.getBoundingClientRect();
    const deltaXPx = e.clientX - dragStart.x;
    const deltaYPx = e.clientY - dragStart.y;

    // Convert pixel delta to percentage
    const deltaX = (deltaXPx / container.width) * 100;
    const deltaY = (deltaYPx / container.height) * 100;

    let newRect = { ...startRect };

    if (mode === 'move') {
      newRect.x = Math.max(0, Math.min(100 - startRect.width, startRect.x + deltaX));
      newRect.y = Math.max(0, Math.min(100 - startRect.height, startRect.y + deltaY));
    } else if (mode === 'resize') {
      newRect.width = Math.max(5, Math.min(100 - startRect.x, startRect.width + deltaX));
      newRect.height = Math.max(5, Math.min(100 - startRect.y, startRect.height + deltaY));
    }

    setRect(newRect);
    onChange(newRect);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setMode(null);
  };

  return (
    <div 
      className="relative w-full max-w-2xl mx-auto select-none overflow-hidden rounded-lg shadow-lg bg-gray-900 border border-gray-700"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      ref={containerRef}
    >
      <img src={imageUrl} alt="Template" className="w-full block pointer-events-none opacity-90" />
      
      {/* Overlay Mask (Darken areas outside selection) */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(transparent 0%, rgba(0,0,0,0.7) 100%)`
      }}></div>

      {/* Selection Box */}
      <div
        className={`absolute border-2 border-indigo-500 bg-indigo-500/20 cursor-move group ${rect.shape === 'circle' ? 'rounded-[50%]' : 'rounded-none'}`}
        style={{
          left: `${rect.x}%`,
          top: `${rect.y}%`,
          width: `${rect.width}%`,
          height: `${rect.height}%`,
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-500 cursor-se-resize flex items-center justify-center rounded-tl-lg shadow-sm z-20"
          onMouseDown={(e) => {
             e.stopPropagation();
             handleMouseDown(e, 'resize');
          }}
        >
          <i className="fas fa-expand text-white text-xs"></i>
        </div>

        {/* Shape Toggle & Label Container */}
        <div className="absolute -top-10 left-0 flex items-center gap-1">
           {/* Label */}
           <div className="bg-indigo-600 text-white text-xs px-2 py-1.5 rounded shadow font-medium whitespace-nowrap">
             Face Area
           </div>
           
           {/* Shape Toggle Button */}
           <button 
             onClick={toggleShape}
             className="bg-white hover:bg-gray-100 text-indigo-600 border border-indigo-200 p-1.5 rounded shadow transition-colors flex items-center justify-center w-8 h-8"
             title={rect.shape === 'circle' ? "Switch to Rectangle" : "Switch to Circle"}
             onMouseDown={(e) => e.stopPropagation()} 
           >
             {rect.shape === 'circle' ? (
                <i className="far fa-square text-lg"></i>
             ) : (
                <i className="far fa-circle text-lg"></i>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default FaceSelector;