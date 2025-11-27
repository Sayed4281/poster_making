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
        if (initialRect) setRect(initialRect);
    }, [initialRect]);

    const toggleShape = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent drag start
        let newShape: 'rect' | 'circle' | 'rounded-rect';
        if (rect.shape === 'rect') newShape = 'circle';
        else if (rect.shape === 'circle') newShape = 'rounded-rect';
        else newShape = 'rect';

        const newRect = { ...rect, shape: newShape, borderRadius: newShape === 'rounded-rect' ? 20 : 0 };
        setRect(newRect);
        onChange(newRect);
    };

    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const radius = parseInt(e.target.value);
        const newRect = { ...rect, borderRadius: radius };
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
            className="relative w-full max-w-2xl mx-auto select-none overflow-hidden rounded-lg sm:rounded-xl shadow-xl sm:shadow-2xl bg-slate-900 border border-slate-700 group/container"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={containerRef}
        >
            <img src={imageUrl} alt="Template" className="w-full block pointer-events-none opacity-80 group-hover/container:opacity-100 transition-opacity duration-300" />

            {/* Overlay Mask (Darken areas outside selection) */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: `radial-gradient(transparent 0%, rgba(15, 23, 42, 0.8) 100%)`
            }}></div>

            {/* Selection Box */}
            <div
                className={`absolute border-2 border-indigo-500 bg-indigo-500/10 cursor-move group shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]`}
                style={{
                    left: `${rect.x}%`,
                    top: `${rect.y}%`,
                    width: `${rect.width}%`,
                    height: `${rect.height}%`,
                    borderRadius: rect.shape === 'circle' ? '50%' : rect.shape === 'rounded-rect' ? `${rect.borderRadius || 0}%` : '0px',
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-indigo-500 cursor-se-resize flex items-center justify-center rounded-tl-md sm:rounded-tl-lg shadow-lg z-20 hover:bg-indigo-400 transition-colors"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, 'resize');
                    }}
                >
                    <i className="fas fa-expand text-white text-[8px] sm:text-[10px]"></i>
                </div>

                {/* Shape Toggle & Label Container */}
                <div className="absolute -top-10 sm:-top-12 left-0 flex items-center gap-1.5 sm:gap-2 z-30 flex-wrap">
                    {/* Label */}
                    <div className="bg-indigo-600 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg shadow-lg font-medium whitespace-nowrap flex items-center gap-1 sm:gap-2">
                        <i className="fas fa-crop-alt text-[10px] sm:text-xs"></i> <span className="hidden xs:inline">Face Area</span><span className="xs:inline sm:hidden">Face</span>
                    </div>

                    {/* Shape Toggle Button */}
                    <button
                        onClick={toggleShape}
                        className="bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-600 p-1 sm:p-1.5 rounded-md sm:rounded-lg shadow-lg transition-all flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 hover:text-white hover:border-indigo-500"
                        title="Toggle Shape"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {rect.shape === 'circle' ? (
                            <i className="far fa-circle text-base sm:text-lg"></i>
                        ) : rect.shape === 'rounded-rect' ? (
                            <i className="far fa-square text-base sm:text-lg rounded-md border-2 border-current scale-75"></i>
                        ) : (
                            <i className="far fa-square text-base sm:text-lg"></i>
                        )}
                    </button>

                    {/* Border Radius Slider */}
                    {rect.shape === 'rounded-rect' && (
                        <div className="bg-slate-800 border border-slate-600 p-1 sm:p-1.5 rounded-md sm:rounded-lg shadow-lg flex items-center gap-1.5 sm:gap-2" onMouseDown={(e) => e.stopPropagation()}>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold">Radius</span>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={rect.borderRadius || 0}
                                onChange={handleRadiusChange}
                                className="w-12 sm:w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-[9px] sm:text-[10px] text-indigo-400 w-3 sm:w-4 text-right">{rect.borderRadius || 0}%</span>
                        </div>
                    )}
                </div>

                {/* Center Crosshair */}
                <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-indigo-400"></div>
                    <div className="absolute left-1/2 top-0 h-full w-[1px] bg-indigo-400"></div>
                </div>
            </div>
        </div >
    );
};

export default FaceSelector;
