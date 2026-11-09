/**
 * Guided smart cutout for uploaded scrapbook photos.
 * Uses a user-drawn lasso (when supplied) plus multi-point, boundary-seeded
 * flood fill instead of guessing the background from four corner pixels.
 */

export interface EdgeDetectionPoint {
  x: number;
  y: number;
}

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
    const a = polygon[i];
    const b = polygon[j];
    const crosses = (a.y > y) !== (b.y > y) &&
      x < ((b.x - a.x) * (y - a.y)) / ((b.y - a.y) || 0.000001) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

export async function processImageEdgeDetection(
  imageSrc: string,
  options: EdgeDetectionOptions = {
    threshold: 28,
    smoothing: 2,
    borderWidth: 6,
    borderColor: '#ffffff',
    addShadow: true,
  }
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const scale = Math.min(1, 1200 / Math.max(width, height));
        const targetW = Math.max(1, Math.round(width * scale));
        const targetH = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(imageSrc);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const imageData = ctx.getImageData(0, 0, targetW, targetH);
        const pixels = imageData.data;
        const total = targetW * targetH;
        const polygon = options.selectionPoints && options.selectionPoints.length >= 8
          ? options.selectionPoints
          : null;
        const inside = new Uint8Array(total);

        if (polygon) {
          for (let y = 0; y < targetH; y++) {
            for (let x = 0; x < targetW; x++) {
              inside[y * targetW + x] = pointInPolygon((x + 0.5) / targetW, (y + 0.5) / targetH, polygon) ? 1 : 0;
            }
          }
        } else {
          inside.fill(1);
        }

        // Estimate the background from many points along the image edge or the
        // user's lasso line, making the result less sensitive to a bad corner.
        const samples: number[][] = [];
        const findInsideIndex = (x: number, y: number): number => {
          const cx = Math.max(0, Math.min(targetW - 1, Math.round(x)));
          const cy = Math.max(0, Math.min(targetH - 1, Math.round(y)));
          for (let radius = 0; radius <= 4; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const px = cx + dx, py = cy + dy;
                if (px >= 0 && px < targetW && py >= 0 && py < targetH && inside[py * targetW + px]) {
                  return py * targetW + px;
                }
              }
            }
          }
          return -1;
        };
        const sampleAt = (x: number, y: number) => {
          const pixelIndex = findInsideIndex(x, y);
          if (pixelIndex < 0) return;
          const index = pixelIndex * 4;
          if (pixels[index + 3] > 20) samples.push([pixels[index], pixels[index + 1], pixels[index + 2]]);
        };

        if (polygon) {
          for (let i = 0; i < polygon.length; i++) {
            const a = polygon[i];
            const b = polygon[(i + 1) % polygon.length];
            const ax = a.x * targetW, ay = a.y * targetH;
            const bx = b.x * targetW, by = b.y * targetH;
            const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 3));
            for (let step = 0; step <= steps; step++) {
              const t = step / steps;
              sampleAt(ax + (bx - ax) * t, ay + (by - ay) * t);
            }
          }
        } else {
          const stride = Math.max(1, Math.floor(Math.min(targetW, targetH) / 180));
          for (let x = 0; x < targetW; x += stride) {
            sampleAt(x, 0); sampleAt(x, targetH - 1);
          }
          for (let y = 0; y < targetH; y += stride) {
            sampleAt(0, y); sampleAt(targetW - 1, y);
          }
        }

        const bg = [
          median(samples.map((sample) => sample[0])),
          median(samples.map((sample) => sample[1])),
          median(samples.map((sample) => sample[2])),
        ];
        const threshold = Math.max(12, (options.threshold / 100) * Math.sqrt(255 * 255 * 3));
        const maxDistance = threshold * (polygon ? 1.45 : 1.25);

        // Seed a flood fill along the lasso/image boundary. Only background
        // connected to that boundary is removed, so enclosed subject details
        // are not erased just because they share a color with the backdrop.
        const visited = new Uint8Array(total);
        const queue = new Int32Array(total);
        let head = 0;
        let tail = 0;
        const enqueue = (index: number) => {
          if (index < 0 || index >= total || visited[index] || !inside[index]) return;
          const p = index * 4;
          if (pixels[p + 3] < 20) { visited[index] = 1; return; }
          const distance = Math.hypot(pixels[p] - bg[0], pixels[p + 1] - bg[1], pixels[p + 2] - bg[2]);
          if (distance > maxDistance) return;
          visited[index] = 1;
          queue[tail++] = index;
        };

        if (polygon) {
          for (let i = 0; i < polygon.length; i++) {
            const a = polygon[i], b = polygon[(i + 1) % polygon.length];
            const ax = a.x * targetW, ay = a.y * targetH;
            const bx = b.x * targetW, by = b.y * targetH;
            const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2));
            for (let step = 0; step <= steps; step++) {
              const t = step / steps;
              const seed = findInsideIndex(ax + (bx - ax) * t, ay + (by - ay) * t);
              if (seed >= 0) enqueue(seed);
            }
          }
        } else {
          for (let x = 0; x < targetW; x++) { enqueue(x); enqueue((targetH - 1) * targetW + x); }
          for (let y = 0; y < targetH; y++) { enqueue(y * targetW); enqueue(y * targetW + targetW - 1); }
        }

        while (head < tail) {
          const index = queue[head++];
          const x = index % targetW;
          const y = Math.floor(index / targetW);
          const p = index * 4;
          pixels[p + 3] = 0;
          if (x > 0) enqueue(index - 1);
          if (x + 1 < targetW) enqueue(index + 1);
          if (y > 0) enqueue(index - targetW);
          if (y + 1 < targetH) enqueue(index + targetW);
        }

        // Everything outside a manually drawn loop is always transparent.
        if (polygon) {
          for (let i = 0; i < total; i++) {
            if (!inside[i]) pixels[i * 4 + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        if (options.borderWidth > 0) {
          const borderCanvas = document.createElement('canvas');
          const padding = Math.ceil(options.borderWidth * 2 + 16);
          borderCanvas.width = targetW + padding * 2;
          borderCanvas.height = targetH + padding * 2;
          const bCtx = borderCanvas.getContext('2d');
          if (bCtx) {
            bCtx.save();
            bCtx.shadowColor = 'rgba(0, 0, 0, 0.22)';
            bCtx.shadowBlur = options.addShadow ? 10 : 0;
            bCtx.shadowOffsetY = options.addShadow ? 5 : 0;
            const radius = options.borderWidth;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 24) {
              bCtx.drawImage(canvas, padding + Math.cos(angle) * radius, padding + Math.sin(angle) * radius);
            }
            bCtx.globalCompositeOperation = 'source-in';
            bCtx.fillStyle = options.borderColor || '#ffffff';
            bCtx.fillRect(0, 0, borderCanvas.width, borderCanvas.height);
            bCtx.restore();
            bCtx.drawImage(canvas, padding, padding);
            return resolve(borderCanvas.toDataURL('image/png'));
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error('Edge detection failed:', error);
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
