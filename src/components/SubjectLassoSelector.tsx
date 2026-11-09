import React, { useRef, useState } from 'react';
export type LassoPoint = { x:number; y:number };
interface Props { imageSrc:string; onSelectionChange:(points:LassoPoint[])=>void; }
export const SubjectLassoSelector:React.FC<Props>=({imageSrc,onSelectionChange})=>{
  const [points,setPoints]=useState<LassoPoint[]>([]);
  const [drawing,setDrawing]=useState(false);
  const surfaceRef=useRef<HTMLDivElement>(null);
  const pointsRef=useRef<LassoPoint[]>([]);
  const getPoint=(e:React.PointerEvent<HTMLDivElement>):LassoPoint=>{
    const rect=surfaceRef.current!.getBoundingClientRect();
    return {x:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))};
  };
  const start=(e:React.PointerEvent<HTMLDivElement>)=>{
    if(e.button!==0&&e.pointerType==='mouse')return;
    e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
    const first=getPoint(e);pointsRef.current=[first];setPoints([first]);setDrawing(true);onSelectionChange([]);
  };
  const move=(e:React.PointerEvent<HTMLDivElement>)=>{
    if(!drawing)return;
    const next=getPoint(e),last=pointsRef.current[pointsRef.current.length-1];
    if(last&&Math.hypot(next.x-last.x,next.y-last.y)<.0025)return;
    pointsRef.current=[...pointsRef.current,next];setPoints(pointsRef.current);
  };
  const finish=()=>{
    if(!drawing)return;setDrawing(false);
    const completed=pointsRef.current;
    if(completed.length>=8)onSelectionChange(completed);
  };
  const clear=()=>{pointsRef.current=[];setPoints([]);setDrawing(false);onSelectionChange([]);};
  const valid=points.length>=8&&!drawing;
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-semibold text-stone-300">Trace around the subject</span>
      <button type="button" onClick={clear} className="text-[10px] text-pink-300 underline">Clear outline</button>
    </div>
    <p className="text-[10px] leading-snug text-stone-400">Trace just outside the object's edge. Keep the entire subject inside the line; the app will preserve everything inside your outline.</p>
    <div ref={surfaceRef} className="relative w-full max-w-full overflow-hidden rounded-xl border border-pink-400/60 touch-none select-none cursor-crosshair"
      onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}>
      <img src={imageSrc} alt="Trace around the subject" draggable={false} className="block w-full h-auto max-h-56 object-contain pointer-events-none" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        {points.length>1&&<polyline points={points.map(p=>`${p.x*1000},${p.y*1000}`).join(' ')} fill="none" stroke="#fb7185" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />}
        {valid&&<polygon points={points.map(p=>`${p.x*1000},${p.y*1000}`).join(' ')} fill="rgba(236,72,153,.10)" stroke="#f9a8d4" strokeWidth="4" strokeDasharray="10 8" />}
      </svg>
    </div>
    <span className="block text-[10px] text-stone-500">{valid?'Outline ready — edge refinement will be conservative and will not shrink it substantially.':drawing?'Keep tracing, then lift your finger.':'Draw a complete loop around the subject to enable cutout.'}</span>
  </div>;
};
