/**
 * Conservative guided sticker cutout.
 *
 * The user's lasso is the guaranteed safety boundary. Edge detection may make
 * small, continuity-checked adjustments to that boundary, but it is never
 * allowed to jump to internal texture or shrink the selected subject.
 */
export interface EdgeDetectionPoint { x: number; y: number; }
export interface EdgeDetectionOptions {
  threshold: number;
  smoothing: number;
  borderWidth: number;
  borderColor: string;
  addShadow: boolean;
  selectionPoints?: EdgeDetectionPoint[];
}
type PixelPoint = { x: number; y: number };

function polygonArea(points: PixelPoint[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}
function resample(points: PixelPoint[], spacing: number): PixelPoint[] {
  const out: PixelPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const count = Math.max(1, Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/spacing));
    for (let j=0;j<count;j++) {
      const t=j/count;
      out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
    }
  }
  return out;
}
function smooth(points: PixelPoint[]): PixelPoint[] {
  if (points.length < 5) return points;
  return points.map((p,i) => {
    const a=points[(i-1+points.length)%points.length], b=points[(i+1)%points.length];
    return {x:p.x*.72+(a.x+b.x)*.14,y:p.y*.72+(a.y+b.y)*.14};
  });
}
function makePath(points: PixelPoint[], width: number, height: number): HTMLCanvasElement {
  const mask=document.createElement('canvas'); mask.width=width; mask.height=height;
  const c=mask.getContext('2d');
  if (!c) return mask;
  c.fillStyle='#fff'; c.beginPath();
  c.moveTo(points[0].x,points[0].y);
  for(let i=1;i<points.length;i++) c.lineTo(points[i].x,points[i].y);
  c.closePath(); c.fill();
  return mask;
}
export async function processImageEdgeDetection(
  imageSrc: string,
  options: EdgeDetectionOptions = {threshold:28,smoothing:2,borderWidth:6,borderColor:'#fff',addShadow:true}
): Promise<string> {
  return new Promise(resolve => {
    const img=new Image();
    img.onload=()=>{
      try {
        const sw=img.naturalWidth||img.width, sh=img.naturalHeight||img.height;
        const input=options.selectionPoints;
        if(!input||input.length<8) { resolve(imageSrc); return; }
        const scale=Math.min(1,1600/Math.max(sw,sh));
        const width=Math.max(1,Math.round(sw*scale)), height=Math.max(1,Math.round(sh*scale));
        const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
        const ctx=canvas.getContext('2d',{willReadFrequently:true});
        if(!ctx){resolve(imageSrc);return;}
        ctx.drawImage(img,0,0,width,height);
        const imageData=ctx.getImageData(0,0,width,height), data=imageData.data;
        const points=input.map(p=>({x:Math.max(0,Math.min(width-1,p.x*width)),y:Math.max(0,Math.min(height-1,p.y*height))}));
        const base=resample(points,4);
        if(base.length<8){resolve(imageSrc);return;}

        // Compute Sobel edge strength only to make small, safe contour corrections.
        const gray=new Float32Array(width*height);
        for(let i=0;i<gray.length;i++){const k=i*4;gray[i]=.299*data[k]+.587*data[k+1]+.114*data[k+2];}
        const edges=new Float32Array(width*height);
        for(let y=1;y<height-1;y++) for(let x=1;x<width-1;x++){
          const i=y*width+x;
          const gx=-gray[i-width-1]+gray[i-width+1]-2*gray[i-1]+2*gray[i+1]-gray[i+width-1]+gray[i+width+1];
          const gy=-gray[i-width-1]-2*gray[i-width]-gray[i-width+1]+gray[i+width-1]+2*gray[i+width]+gray[i+width+1];
          edges[i]=Math.hypot(gx,gy)/4;
        }
        const radius=Math.max(3,Math.min(10,Math.round(Math.min(width,height)*.006)));
        const minStrength=Math.max(34,Math.min(85,options.threshold*1.8));
        const candidate:PixelPoint[]=[];
        let previous:PixelPoint|null=null;
        for(const p of base){
          let best=p, bestScore=minStrength;
          const cx=Math.round(p.x),cy=Math.round(p.y);
          for(let dy=-radius;dy<=radius;dy++) for(let dx=-radius;dx<=radius;dx++){
            const d=Math.hypot(dx,dy); if(d>radius) continue;
            const x=cx+dx,y=cy+dy;
            if(x<1||x>=width-1||y<1||y>=height-1) continue;
            // Avoid discontinuous jumps between neighboring contour samples.
            if(previous && Math.hypot(x-previous.x,y-previous.y)>Math.max(12,radius*2.2)) continue;
            const strength=edges[y*width+x];
            const score=strength/(1+d*.32);
            if(score>bestScore){bestScore=score;best={x,y};}
          }
          candidate.push(best); previous=best;
        }
        let refined=smooth(smooth(candidate));
        const originalArea=polygonArea(base), refinedArea=polygonArea(refined);
        const displacement=refined.reduce((sum,p,i)=>sum+Math.hypot(p.x-base[i].x,p.y-base[i].y),0)/base.length;
        const maxDisplacement=refined.reduce((m,p,i)=>Math.max(m,Math.hypot(p.x-base[i].x,p.y-base[i].y)),0);
        // Reject the entire refinement if it changes the selected area materially.
        if(!Number.isFinite(refinedArea)||refinedArea<originalArea*.82||refinedArea>originalArea*1.18||
          displacement>radius*.65||maxDisplacement>radius*1.25) refined=base;

        // Anti-aliased alpha mask. The lasso remains the guaranteed outer limit.
        const mask=makePath(refined,width,height);
        ctx.globalCompositeOperation='destination-in';
        ctx.drawImage(mask,0,0);
        ctx.globalCompositeOperation='source-over';
        ctx.putImageData(imageData,0,0);
        // Reapply mask after putImageData (which overwrites canvas pixels).
        ctx.globalCompositeOperation='destination-in'; ctx.drawImage(mask,0,0); ctx.globalCompositeOperation='source-over';

        if(options.borderWidth>0){
          const pad=Math.ceil(options.borderWidth*2+16), out=document.createElement('canvas');
          out.width=width+pad*2;out.height=height+pad*2;
          const oc=out.getContext('2d');
          if(oc){
            oc.save();oc.shadowColor='rgba(0,0,0,.22)';oc.shadowBlur=options.addShadow?10:0;oc.shadowOffsetY=options.addShadow?5:0;
            for(let a=0;a<Math.PI*2;a+=Math.PI/24) oc.drawImage(canvas,pad+Math.cos(a)*options.borderWidth,pad+Math.sin(a)*options.borderWidth);
            oc.globalCompositeOperation='source-in';oc.fillStyle=options.borderColor||'#fff';oc.fillRect(0,0,out.width,out.height);oc.restore();
            oc.drawImage(canvas,pad,pad);resolve(out.toDataURL('image/png'));return;
          }
        }
        resolve(canvas.toDataURL('image/png'));
      }catch(err){console.error('Guided subject cutout failed:',err);resolve(imageSrc);}
    };
    img.onerror=()=>resolve(imageSrc);
    img.src=imageSrc;
  });
}
