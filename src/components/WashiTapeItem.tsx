import React, { useState, useRef, useEffect } from 'react';
import { PlacedTape, TapePattern } from '../types/journal';
import { RotateCw, Trash2, ArrowUp, ArrowDown, Edit3, Check, Copy } from 'lucide-react';
import { sounds } from '../utils/sound';

interface WashiTapeItemProps {
  tape: PlacedTape;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: Partial<PlacedTape>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

export const WashiTapeItem: React.FC<WashiTapeItemProps> = ({
  tape,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
}) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [textValue, setTextValue] = useState(tape.text);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTextValue(tape.text);
  }, [tape.text]);

  const getPatternClass = (pattern: TapePattern) => {
    switch (pattern) {
      case 'grid':
        return 'tape-pattern-grid';
      case 'dots':
        return 'tape-pattern-dots';
      case 'stripes':
        return 'tape-pattern-stripes';
      case 'kraft':
        return 'tape-pattern-kraft';
      case 'caution':
        return 'tape-pattern-caution';
      case 'lavender':
        return 'tape-pattern-lavender';
      case 'frosted':
        return 'tape-pattern-frosted';
      case 'cyan':
        return 'tape-pattern-cyan';
      default:
        return 'tape-pattern-grid';
    }
  };

  const getFontClass = (font: string) => {
    switch (font) {
      case 'handwriting':
        return 'font-handwriting';
      case 'marker':
        return 'font-marker';
      case 'typewriter':
        return 'font-typewriter';
      case 'mono':
        return 'font-mono-code';
      case 'doodle':
        return 'font-doodle';
      default:
        return 'font-handwriting';
    }
  };

  // Dragging handlers for mouse and touch
  const handleStartDrag = (clientX: number, clientY: number) => {
    if (isEditingText) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      initialX: tape.x,
      initialY: tape.y,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e);
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
    handleStartDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    onSelect(e as any);
    if (e.touches.length === 1) {
      handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging || !dragStartRef.current) return;
      const dx = clientX - dragStartRef.current.mouseX;
      const dy = clientY - dragStartRef.current.mouseY;

      // Update position in percentage relative to parent canvas size
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

  const handleRotate = () => {
    sounds.playTapeTear();
    const nextRot = (tape.rotation + 15) % 360;
    onUpdate({ rotation: nextRot > 180 ? nextRot - 360 : nextRot });
  };

  const handleSaveText = () => {
    onUpdate({ text: textValue });
    setIsEditingText(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditingText(true);
      }}
      style={{
        left: `${tape.x}%`,
        top: `${tape.y}%`,
        width: `${tape.width}px`,
        height: `${tape.height}px`,
        transform: `translate(-50%, -50%) rotate(${tape.rotation}deg)`,
        zIndex: tape.zIndex,
        opacity: tape.opacity ?? 0.9,
      }}
      className={`absolute cursor-move select-none transition-shadow touch-none group ${
        isSelected ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
      }`}
    >
      {/* Washi Tape Strip with Jagged Torn Ends */}
      <div
        className={`w-full h-full washi-torn-edge shadow-md flex items-center justify-center px-3 overflow-hidden ${getPatternClass(
          tape.pattern
        )}`}
      >
        {isEditingText ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveText();
            }}
            className="w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              autoFocus
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onBlur={handleSaveText}
              className={`w-full text-center bg-white/70 text-xs px-1 py-0.5 rounded outline-none font-bold text-stone-900 border border-stone-400`}
            />
            <button type="submit" className="p-0.5 ml-1 text-emerald-800">
              <Check size={12} />
            </button>
          </form>
        ) : (
          <span
            style={{ color: tape.textColor }}
            className={`text-center font-bold tracking-wide text-xs sm:text-sm truncate select-none drop-shadow-xs ${getFontClass(
              tape.fontFamily
            )}`}
          >
            {tape.text || '✎ click to write...'}
          </span>
        )}
      </div>

      {/* Control overlay when selected */}
      {isSelected && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-stone-900/95 text-white px-2 py-1 rounded-xl shadow-xl text-xs z-50 whitespace-nowrap"
        >
          {/* Edit text */}
          <button
            onClick={() => setIsEditingText(!isEditingText)}
            title="Write on Tape"
            className="p-1 hover:bg-stone-800 rounded text-pink-400"
          >
            <Edit3 size={13} />
          </button>

          {/* Rotate */}
          <button
            onClick={handleRotate}
            title="Rotate Tape"
            className="p-1 hover:bg-stone-800 rounded text-amber-400"
          >
            <RotateCw size={13} />
          </button>

          {/* Layer Controls: Put tape over sticker or under sticker */}
          <button
            onClick={onBringForward}
            title="Bring Tape Forward (over stickers)"
            className="p-1 hover:bg-stone-800 rounded text-sky-400"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={onSendBackward}
            title="Send Tape Backward (under stickers)"
            className="p-1 hover:bg-stone-800 rounded text-sky-400"
          >
            <ArrowDown size={13} />
          </button>

          {/* Duplicate */}
          <button
            onClick={onDuplicate}
            title="Duplicate Tape"
            className="p-1 hover:bg-stone-800 rounded text-emerald-400"
          >
            <Copy size={13} />
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            title="Remove Tape"
            className="p-1 hover:bg-rose-900/50 rounded text-rose-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
