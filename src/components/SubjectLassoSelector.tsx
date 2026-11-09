import React, { useRef, useState } from 'react';

export type LassoPoint = { x: number; y: number };

interface SubjectLassoSelectorProps {
  imageSrc: string;
  onSelectionChange: (points: LassoPoint[]) => void;
}

export const SubjectLassoSelector: React.FC<SubjectLassoSelectorProps> = ({ imageSrc, onSelectionChange }) => {
  const [points, setPoints] = useState<LassoPoint[]>([]);
  const [drawing, setDrawing] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const getPoint = (event: React.PointerEvent<HTMLDivElement>): LassoPoint => {
    const rect = surfaceRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  };

  const start = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const first = getPoint(event);
    setPoints([first]);
    setDrawing(true);
    onSelectionChange([]);
  };

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drawing) return;
    const next = getPoint(event);
    setPoints((current) => {
      const last = current[current.length - 1];
      if (last && Math.hypot(next.x - last.x, next.y - last.y) < 0.003) return current;
      return [...current, next];
    });
  };

  const finish = () => {
    if (!drawing) return;
    setDrawing(false);
    if (points.length >= 8) onSelectionChange(points);
  };

  const clear = () => {
    setPoints([]);
    onSelectionChange([]);
  };

  const valid = points.length >= 8 && !drawing;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-stone-300">Circle around the subject</span>
        <button type="button" onClick={clear} className="text-[10px] text-pink-300 underline">Clear outline</button>
      </div>
      <p className="text-[10px] leading-snug text-stone-400">
        Draw a loose loop around the object with your finger. Keep the whole subject inside the line.
      </p>
      <div
        ref={surfaceRef}
        className="relative inline-block max-w-full overflow-hidden rounded-xl border border-pink-400/60 touch-none select-none cursor-crosshair"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        <img src={imageSrc} alt="Trace around the subject" draggable={false} className="block max-w-full max-h-56 w-auto object-contain pointer-events-none" />
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          {points.length > 1 && (
            <polyline
              points={points.map((point) => `${point.x * 1000},${point.y * 1000}`).join(' ')}
              fill="none"
              stroke="#fb7185"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />
          )}
          {valid && (
            <polygon
              points={points.map((point) => `${point.x * 1000},${point.y * 1000}`).join(' ')}
              fill="rgba(236,72,153,0.10)"
              stroke="#f9a8d4"
              strokeWidth="4"
              strokeDasharray="10 8"
            />
          )}
        </svg>
      </div>
      <span className="block text-[10px] text-stone-500">{valid ? 'Outline ready — the cutout will be refined inside it.' : drawing ? 'Keep tracing, then lift your finger.' : 'Draw a complete loop to enable guided cutout.'}</span>
    </div>
  );
};
