/**
 * Subject-aware sticker cutout.
 *
 * A user-drawn lasso defines the search region. Background is learned from
 * colors immediately inside that lasso and removed only when connected to
 * the lasso boundary. Strong image gradients act as subject-edge barriers,
 * so the cut follows the object rather than the rectangular photo boundary.
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

function median(values: number[]): number {
  if (!values.length) return 0;
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

function pointInPolygon(x: number, y: number, polygon: EdgeDetectionPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > y) !== (b.y > y) &&
      x < ((b.x - a.x) * (y - a.y)) / ((b.y - a.y) || 0.000001) + a.x) inside = !inside;
  }
  return inside;
}

export async function processImageEdgeDetection(
  imageSrc: string,
  options: EdgeDetectionOptions = {
    threshold: 28, smoothing: 2, borderWidth: 6,
    borderColor: '#ffffff', addShadow: true,
  }
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const polygon = options.selectionPoints && options.selectionPoints.length >= 8
          ? options.selectionPoints : null;

        // Never fall back to tracing the photo rectangle. Without a lasso we
        // cannot know which object the user wants, so preserve the original.
        if (!polygon) return resolve(imageSrc);

        const scale = Math.min(1, 1400 / Math.max(width, height));
        const w = Math.max(1, Math.round(width * scale));
        const h = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(imageSrc);
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const px = imageData.data;
        const total = w * h;
        const inside = new Uint8Array(total);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          inside[y * w + x] = pointInPolygon((x + .5) / w, (y + .5) / h, polygon) ? 1 : 0;
        }

        // Collect a palette of background colors around the complete lasso.
        // Multiple local colors handle shadows, gradients and uneven lighting.
        const samples: number[][] = [];
        const nearestInside = (x: number, y: number) => {
          const cx = Math.max(0, Math.min(w - 1, Math.round(x)));
          const cy = Math.max(0, Math.min(h - 1, Math.round(y)));
          for (let r = 0; r <= 7; r++) {
            for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
              const xx = cx + dx, yy = cy + dy;
              if (xx >= 0 && xx < w && yy >= 0 && yy < h && inside[yy * w + xx]) return yy * w + xx;
            }
          }
          return -1;
        };
        for (let i = 0; i < polygon.length; i++) {
          const a = polygon[i], b = polygon[(i + 1) % polygon.length];
          const ax = a.x * w, ay = a.y * h, bx = b.x * w, by = b.y * h;
          const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2));
          for (let s = 0; s <= steps; s++) {
            const t = s / steps, index = nearestInside(ax + (bx - ax) * t, ay + (by - ay) * t);
            if (index >= 0) {
              const p = index * 4;
              if (px[p + 3] > 20) samples.push([px[p], px[p + 1], px[p + 2]]);
            }
          }
        }
        if (!samples.length) return resolve(imageSrc);

        // Thin the palette to evenly distributed samples for fast comparisons.
        const palette = samples.filter((_, i) => i % Math.max(1, Math.floor(samples.length / 80)) === 0).slice(0, 100);
        const threshold = Math.max(14, (options.threshold / 100) * 255 * 1.35);
        const colorDistance = (index: number) => {
          const p = index * 4;
          let best = Infinity;
          for (const c of palette) {
            const dr = px[p] - c[0], dg = px[p + 1] - c[1], db = px[p + 2] - c[2];
            const d = Math.sqrt(dr * dr + dg * dg + db * db);
            if (d < best) best = d;
          }
          return best;
        };

        // Sobel-like luminance gradient. High gradients are likely real
        // subject contours and stop background flood-fill crossing them.
        const luminance = new Float32Array(total);
        for (let i = 0; i < total; i++) {
          const p = i * 4;
          luminance[i] = .299 * px[p] + .587 * px[p + 1] + .114 * px[p + 2];
        }
        const gradient = new Float32Array(total);
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          const gx = -luminance[i-w-1] + luminance[i-w+1] - 2*luminance[i-1] + 2*luminance[i+1] - luminance[i+w-1] + luminance[i+w+1];
          const gy = -luminance[i-w-1] - 2*luminance[i-w] - luminance[i-w+1] + luminance[i+w-1] + 2*luminance[i+w] + luminance[i+w+1];
          gradient[i] = Math.hypot(gx, gy) / 4;
        }
        const edgeBarrier = Math.max(16, threshold * .52);
        const visited = new Uint8Array(total);
        const removed = new Uint8Array(total);
        const queue = new Int32Array(total);
        let head = 0, tail = 0;
        const enqueue = (i: number) => {
          if (i < 0 || i >= total || visited[i] || !inside[i]) return;
          visited[i] = 1;
          const p = i * 4;
          if (px[p + 3] < 20) { removed[i] = 1; return; }
          if (colorDistance(i) > threshold * 1.55) return;
          queue[tail++] = i;
        };

        // Seed the fill all along the user's lasso, not the image perimeter.
        for (let i = 0; i < polygon.length; i++) {
          const a = polygon[i], b = polygon[(i + 1) % polygon.length];
          const ax = a.x * w, ay = a.y * h, bx = b.x * w, by = b.y * h;
          const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 1.5));
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const index = nearestInside(ax + (bx - ax) * t, ay + (by - ay) * t);
            if (index >= 0) enqueue(index);
          }
        }

        while (head < tail) {
          const i = queue[head++];
          removed[i] = 1;
          const x = i % w, y = Math.floor(i / w);
          const neighbors = [x > 0 ? i - 1 : -1, x + 1 < w ? i + 1 : -1, y > 0 ? i - w : -1, y + 1 < h ? i + w : -1];
          for (const n of neighbors) {
            if (n < 0 || visited[n] || !inside[n]) continue;
            // Do not let the background leak through a strong subject edge.
            if (gradient[n] > edgeBarrier) { visited[n] = 1; continue; }
            enqueue(n);
          }
        }

        // Pixels outside the lasso are always transparent; connected
        // background inside it is removed, leaving the subject silhouette.
        for (let i = 0; i < total; i++) {
          if (!inside[i] || removed[i]) px[i * 4 + 3] = 0;
        }
        ctx.putImageData(imageData, 0, 0);

        if (options.borderWidth > 0) {
          const borderCanvas = document.createElement('canvas');
          const padding = Math.ceil(options.borderWidth * 2 + 16);
          borderCanvas.width = w + padding * 2;
          borderCanvas.height = h + padding * 2;
          const bCtx = borderCanvas.getContext('2d');
          if (bCtx) {
            bCtx.save();
            bCtx.shadowColor = 'rgba(0,0,0,.22)';
            bCtx.shadowBlur = options.addShadow ? 10 : 0;
            bCtx.shadowOffsetY = options.addShadow ? 5 : 0;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 24) {
              bCtx.drawImage(canvas, padding + Math.cos(angle) * options.borderWidth, padding + Math.sin(angle) * options.borderWidth);
            }
            bCtx.globalCompositeOperation = 'source-in';
            bCtx.fillStyle = options.borderColor || '#fff';
            bCtx.fillRect(0, 0, borderCanvas.width, borderCanvas.height);
            bCtx.restore();
            bCtx.drawImage(canvas, padding, padding);
            return resolve(borderCanvas.toDataURL('image/png'));
          }
        }
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error('Subject edge detection failed:', error);
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
