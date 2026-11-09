/**
 * Guided, edge-snapped sticker cutout.
 *
 * The old color flood-fill could classify subject pixels as background. This
 * implementation never removes pixels based on color similarity. It detects
 * image gradients, gently snaps the user's lasso toward nearby contours, then
 * uses that refined contour as the alpha mask. If no convincing edge is found,
 * it keeps the user's original lasso rather than guessing and destroying the
 * subject.
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

function pointInPolygon(x: number, y: number, polygon: PixelPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > y) !== (b.y > y) &&
      x < ((b.x - a.x) * (y - a.y)) / ((b.y - a.y) || 0.000001) + a.x) inside = !inside;
  }
  return inside;
}

function resampleClosedPath(points: PixelPoint[], spacing: number): PixelPoint[] {
  const result: PixelPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(distance / spacing));
    for (let step = 0; step < steps; step++) {
      const t = step / steps;
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return result;
}

function smoothPath(points: PixelPoint[]): PixelPoint[] {
  if (points.length < 5) return points;
  return points.map((point, i) => {
    const before = points[(i - 1 + points.length) % points.length];
    const after = points[(i + 1) % points.length];
    return {
      x: point.x * 0.6 + (before.x + after.x) * 0.2,
      y: point.y * 0.6 + (before.y + after.y) * 0.2,
    };
  });
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
        const sourceWidth = img.naturalWidth || img.width;
        const sourceHeight = img.naturalHeight || img.height;
        const rawPoints = options.selectionPoints;
        if (!rawPoints || rawPoints.length < 8) return resolve(imageSrc);

        const scale = Math.min(1, 1800 / Math.max(sourceWidth, sourceHeight));
        const width = Math.max(1, Math.round(sourceWidth * scale));
        const height = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(imageSrc);
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        const total = width * height;
        const gray = new Float32Array(total);
        for (let i = 0; i < total; i++) {
          const p = i * 4;
          gray[i] = 0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2];
        }

        // Sobel gradient magnitude. Strong gradients are likely object contours.
        const edge = new Float32Array(total);
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const i = y * width + x;
            const gx =
              -gray[i - width - 1] + gray[i - width + 1] -
              2 * gray[i - 1] + 2 * gray[i + 1] -
              gray[i + width - 1] + gray[i + width + 1];
            const gy =
              -gray[i - width - 1] - 2 * gray[i - width] - gray[i - width + 1] +
              gray[i + width - 1] + 2 * gray[i + width] + gray[i + width + 1];
            edge[i] = Math.hypot(gx, gy) / 4;
          }
        }

        const original = rawPoints.map(point => ({
          x: Math.max(0, Math.min(width - 1, point.x * width)),
          y: Math.max(0, Math.min(height - 1, point.y * height)),
        }));
        const originalPath = resampleClosedPath(original, 3);
        const searchRadius = Math.max(8, Math.min(26, Math.round(Math.min(width, height) * 0.018)));
        const minEdgeStrength = Math.max(22, Math.min(72, options.threshold * 1.05));
        const snapped: PixelPoint[] = [];

        // Snap each lasso sample only to a nearby, strong edge. Distance is
        // penalized so a distant background texture cannot pull the outline away.
        for (const point of originalPath) {
          let best = point;
          let bestScore = minEdgeStrength * 0.72;
          const cx = Math.round(point.x), cy = Math.round(point.y);
          for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
              const distance = Math.hypot(dx, dy);
              if (distance > searchRadius) continue;
              const x = cx + dx, y = cy + dy;
              if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) continue;
              const index = y * width + x;
              const strength = edge[index];
              const score = strength / (1 + distance * 0.11);
              if (score > bestScore) {
                bestScore = score;
                best = { x, y };
              }
            }
          }
          snapped.push(best);
        }

        // Blend adjacent samples to prevent isolated texture edges from creating
        // spikes while retaining the overall contour shape.
        let refined = smoothPath(smoothPath(snapped));

        // Do not allow a snap to jump across the image or collapse the selection.
        const originalCenter = original.reduce((acc, p) => ({ x: acc.x + p.x / original.length, y: acc.y + p.y / original.length }), { x: 0, y: 0 });
        const refinedCenter = refined.reduce((acc, p) => ({ x: acc.x + p.x / refined.length, y: acc.y + p.y / refined.length }), { x: 0, y: 0 });
        const centerShift = Math.hypot(originalCenter.x - refinedCenter.x, originalCenter.y - refinedCenter.y);
        if (!Number.isFinite(centerShift) || centerShift > searchRadius * 1.5) refined = originalPath;

        // Rasterize the refined outline as a hard subject mask. Crucially, no
        // color-based flood fill is used: subject colors/details are never erased.
        const maskPolygon = refined.length >= 8 ? refined : originalPath;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (!pointInPolygon(x + 0.5, y + 0.5, maskPolygon)) {
              pixels[(y * width + x) * 4 + 3] = 0;
            }
          }
        }
        ctx.putImageData(imageData, 0, 0);

        if (options.borderWidth > 0) {
          const borderCanvas = document.createElement('canvas');
          const padding = Math.ceil(options.borderWidth * 2 + 16);
          borderCanvas.width = width + padding * 2;
          borderCanvas.height = height + padding * 2;
          const borderCtx = borderCanvas.getContext('2d');
          if (borderCtx) {
            borderCtx.save();
            borderCtx.shadowColor = 'rgba(0,0,0,.22)';
            borderCtx.shadowBlur = options.addShadow ? 10 : 0;
            borderCtx.shadowOffsetY = options.addShadow ? 5 : 0;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 24) {
              borderCtx.drawImage(canvas, padding + Math.cos(angle) * options.borderWidth, padding + Math.sin(angle) * options.borderWidth);
            }
            borderCtx.globalCompositeOperation = 'source-in';
            borderCtx.fillStyle = options.borderColor || '#ffffff';
            borderCtx.fillRect(0, 0, borderCanvas.width, borderCanvas.height);
            borderCtx.restore();
            borderCtx.drawImage(canvas, padding, padding);
            return resolve(borderCanvas.toDataURL('image/png'));
          }
        }
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error('Guided edge cutout failed:', error);
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
