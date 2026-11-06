import React, { useState, useRef, useEffect } from 'react';
import { PlacedSticker, StickerFilter, StickerTexture, StickerBorder } from '../types/journal';
import {
  RotateCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  FlipHorizontal,
  Sparkles,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface StickerItemProps {
  sticker: PlacedSticker;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: Partial<PlacedSticker>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

export const StickerItem: React.FC<StickerItemProps> = ({
  sticker,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging handlers for mouse and touch
  const handleStartDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      initialX: sticker.x,
      initialY: sticker.y,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e);
    if ((e.target as HTMLElement).closest('.sticker-controls')) return;
    handleStartDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    onSelect(e as any);
    if ((e.target as HTMLElement).closest('.sticker-controls')) return;
    if (e.touches.length === 1) {
      handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging || !dragStartRef.current) return;
      const dx = clientX - dragStartRef.current.mouseX;
      const dy = clientY - dragStartRef.current.mouseY;

      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const pctX = dragStartRef.current.initialX + (dx / rect.width) * 100;
      const pctY = dragStartRef.current.initialY + (dy / rect.height) * 100;

      onUpdate({
        x: Math.max(0, Math.min(95, pctX)),
        y: Math.max(0, Math.min(95, pctY)),
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        dragStartRef.current = null;
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playStickerPop();
    const nextRot = (sticker.rotation + 15) % 360;
    onUpdate({ rotation: nextRot > 180 ? nextRot - 360 : nextRot });
  };

  const handleScaleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    // Cycle scale: 1 -> 1.25 -> 1.5 -> 0.75 -> 1
    const nextScale = sticker.scale >= 1.5 ? 0.75 : sticker.scale >= 1.25 ? 1.5 : sticker.scale >= 1 ? 1.25 : 1;
    onUpdate({ scale: nextScale });
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    onUpdate({ isFlippedX: !sticker.isFlippedX });
  };

  // Get filter classes
  const getFilterClass = (filter: StickerFilter) => {
    switch (filter) {
      case 'vintage':
        return 'photo-filter-vintage';
      case 'sepia':
        return 'photo-filter-sepia';
      case 'monochrome':
        return 'photo-filter-monochrome';
      case 'warm':
        return 'photo-filter-warm';
      case 'cyan':
        return 'photo-filter-cyan';
      case 'polaroid':
        return 'photo-filter-polaroid';
      case 'highcontrast':
        return 'photo-filter-highcontrast';
      case 'none':
      default:
        return '';
    }
  };

  const getTextureClass = (texture: StickerTexture) => {
    switch (texture) {
      case 'glossy':
        return 'sticker-filter-glossy';
      case 'holographic':
        return 'sticker-filter-holographic';
      case 'matte':
        return 'sticker-filter-matte';
      case 'crinkled':
        return 'sticker-filter-crinkled';
      case 'glitter':
        return 'sticker-filter-glitter';
      case 'acetate':
        return 'sticker-filter-acetate';
      case 'none':
      default:
        return '';
    }
  };

  const getBorderClass = (border: StickerBorder) => {
    switch (border) {
      case 'diecut':
        return 'border-diecut';
      case 'polaroid':
        return 'border-polaroid';
      case 'stamp':
        return 'border-stamp';
      case 'gold':
        return 'border-gold rounded-lg';
      case 'neon':
        return 'border-neon rounded-lg';
      case 'none':
      default:
        return 'drop-shadow-md';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        width: `${sticker.width}px`,
        height: `${sticker.height}px`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale || 1}) scaleX(${
          sticker.isFlippedX ? -1 : 1
        })`,
        zIndex: sticker.zIndex,
      }}
      className={`absolute cursor-move select-none transition-shadow touch-none group ${
        isSelected ? 'ring-2 ring-pink-500 ring-offset-2' : ''
      }`}
    >
      {/* Sticker / Photo Graphic with Texture & Border applied */}
      <div
        className={`w-full h-full flex items-center justify-center overflow-hidden transition-transform ${getBorderClass(
          sticker.borderStyle
        )} ${getTextureClass(sticker.texture)}`}
      >
        <img
          src={sticker.src}
          alt={sticker.alt}
          draggable={false}
          className={`w-full h-full object-contain pointer-events-none ${getFilterClass(sticker.filter)}`}
        />
      </div>

      {/* Floating Control Toolbar when selected */}
      {isSelected && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="sticker-controls absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-stone-900/95 text-white px-2 py-1 rounded-xl shadow-2xl text-xs z-50 whitespace-nowrap border border-white/10"
        >
          {/* Rotate */}
          <button
            onClick={handleRotate}
            title="Rotate +15°"
            className="p-1.5 hover:bg-stone-800 rounded text-amber-400 active:scale-90"
          >
            <RotateCw size={13} />
          </button>

          {/* Scale */}
          <button
            onClick={handleScaleToggle}
            title={`Scale (${sticker.scale || 1}x)`}
            className="p-1.5 hover:bg-stone-800 rounded text-sky-400 active:scale-90 flex items-center text-[10px] font-bold"
          >
            <Maximize2 size={12} className="mr-0.5" />
            {sticker.scale || 1}x
          </button>

          {/* Flip */}
          <button
            onClick={handleFlip}
            title="Flip Horizontal"
            className="p-1.5 hover:bg-stone-800 rounded text-purple-400 active:scale-90"
          >
            <FlipHorizontal size={13} />
          </button>

          {/* Style & Texture Filter Menu Toggle */}
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            title="Filters & Physical Textures"
            className={`p-1.5 hover:bg-stone-800 rounded ${
              showStyleMenu ? 'bg-pink-600 text-white' : 'text-pink-400'
            } active:scale-90`}
          >
            <Sliders size={13} />
          </button>

          {/* Layer up/down */}
          <button
            onClick={onBringForward}
            title="Bring Forward"
            className="p-1.5 hover:bg-stone-800 rounded text-emerald-400 active:scale-90"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={onSendBackward}
            title="Send Backward"
            className="p-1.5 hover:bg-stone-800 rounded text-emerald-400 active:scale-90"
          >
            <ArrowDown size={13} />
          </button>

          {/* Duplicate */}
          <button
            onClick={onDuplicate}
            title="Duplicate Sticker"
            className="p-1.5 hover:bg-stone-800 rounded text-indigo-400 active:scale-90"
          >
            <Copy size={13} />
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            title="Remove Sticker"
            className="p-1.5 hover:bg-rose-900/60 rounded text-rose-400 active:scale-90"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Extended Filters & Physical Textures Flyout */}
      {isSelected && showStyleMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="sticker-controls absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-stone-900/95 backdrop-blur-md text-stone-200 p-3 rounded-2xl shadow-2xl border border-stone-700 z-50 text-xs"
        >
          {/* Border Styles */}
          <div className="mb-2.5">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
              Sticker Border
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(['diecut', 'polaroid', 'stamp', 'gold', 'neon', 'none'] as StickerBorder[]).map(
                (b) => (
                  <button
                    key={b}
                    onClick={() => {
                      sounds.playClick();
                      onUpdate({ borderStyle: b });
                    }}
                    className={`py-1 px-1.5 rounded-lg text-center text-[10px] capitalize transition ${
                      sticker.borderStyle === b
                        ? 'bg-pink-600 text-white font-bold'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {b}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Realistic Physical Sticker Textures */}
          <div className="mb-2.5">
            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 mb-1">
              <Sparkles size={11} /> Realistic Sticker Textures
            </span>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  { id: 'glossy', label: 'Glossy Foil' },
                  { id: 'holographic', label: 'Holographic' },
                  { id: 'matte', label: 'Matte Vinyl' },
                  { id: 'crinkled', label: 'Crinkled Paper' },
                  { id: 'glitter', label: 'Glitter Shimmer' },
                  { id: 'acetate', label: 'Translucent Film' },
                  { id: 'none', label: 'Standard Flat' },
                ] as { id: StickerTexture; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    sounds.playStickerPop();
                    onUpdate({ texture: t.id });
                  }}
                  className={`py-1 px-1.5 rounded-lg text-left text-[10px] truncate transition ${
                    sticker.texture === t.id
                      ? 'bg-amber-500 text-stone-900 font-bold'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Filters */}
          <div>
            <span className="text-[10px] uppercase font-bold text-sky-400 block mb-1">
              Photo Color Filters
            </span>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  { id: 'vintage', label: '70s Vintage' },
                  { id: 'sepia', label: 'Warm Sepia' },
                  { id: 'monochrome', label: 'B&W Noir' },
                  { id: 'warm', label: 'Golden Hour' },
                  { id: 'cyan', label: 'Y2K Cyber Cyan' },
                  { id: 'polaroid', label: 'Polaroid Fade' },
                  { id: 'highcontrast', label: 'Lo-Fi Flash' },
                  { id: 'none', label: 'No Filter' },
                ] as { id: StickerFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    sounds.playClick();
                    onUpdate({ filter: f.id });
                  }}
                  className={`py-1 px-1.5 rounded-lg text-left text-[10px] truncate transition ${
                    sticker.filter === f.id
                      ? 'bg-sky-500 text-stone-900 font-bold'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
