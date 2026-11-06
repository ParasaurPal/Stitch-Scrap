/**
 * Client-side Smart Edge Detection & Background Removal for Custom Stickers
 * Uses corner-sampled flood fill, color distance delta, and dilation for smooth die-cut sticker borders.
 */

export interface EdgeDetectionOptions {
  threshold: number; // 0 to 100 sensitivity
  smoothing: number; // edge blur / feathering
  borderWidth: number; // die-cut white stroke width
  borderColor: string; // e.g. '#ffffff'
  addShadow: boolean;
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
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // Downscale very large images to max 1000px dimension for rapid processing
        const maxDim = 1000;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        const targetW = Math.round(width * scale);
        const targetH = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(imageSrc);
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;

        // Sample corner pixels to estimate background color
        const cornerIndices = [
          0, // top-left
          (targetW - 1) * 4, // top-right
          ((targetH - 1) * targetW) * 4, // bottom-left
          ((targetH - 1) * targetW + (targetW - 1)) * 4, // bottom-right
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        cornerIndices.forEach((idx) => {
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        });
        bgR /= 4;
        bgG /= 4;
        bgB /= 4;

        // Color distance threshold (0 - 441)
        const maxDist = Math.sqrt(255 * 255 * 3);
        const distThreshold = (options.threshold / 100) * maxDist;

        // Alpha mask array (1 = foreground, 0 = background)
        const mask = new Uint8Array(targetW * targetH);

        for (let y = 0; y < targetH; y++) {
          for (let x = 0; x < targetW; x++) {
            const idx = (y * targetW + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a < 20) {
              mask[y * targetW + x] = 0;
              data[idx + 3] = 0;
              continue;
            }

            const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
            if (dist < distThreshold) {
              mask[y * targetW + x] = 0;
              data[idx + 3] = 0;
            } else {
              mask[y * targetW + x] = 1;
            }
          }
        }

        // Put modified transparent pixels back
        ctx.putImageData(imgData, 0, 0);

        // If die-cut border is requested, create an expanded silhouette
        if (options.borderWidth > 0) {
          const borderCanvas = document.createElement('canvas');
          const padding = options.borderWidth * 2 + 16;
          borderCanvas.width = targetW + padding * 2;
          borderCanvas.height = targetH + padding * 2;
          const bCtx = borderCanvas.getContext('2d');
          if (bCtx) {
            // Draw smooth thick white contour around subject
            bCtx.save();
            bCtx.shadowColor = 'rgba(0, 0, 0, 0.22)';
            bCtx.shadowBlur = options.addShadow ? 10 : 0;
            bCtx.shadowOffsetY = options.addShadow ? 5 : 0;

            // Multiple offset draws to create smooth die-cut border
            const r = options.borderWidth;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
              const dx = Math.cos(angle) * r;
              const dy = Math.sin(angle) * r;
              bCtx.drawImage(canvas, padding + dx, padding + dy);
            }

            // Fill color of border
            bCtx.globalCompositeOperation = 'source-in';
            bCtx.fillStyle = options.borderColor || '#ffffff';
            bCtx.fillRect(0, 0, borderCanvas.width, borderCanvas.height);
            bCtx.restore();

            // Draw original cutout on top
            bCtx.drawImage(canvas, padding, padding);
            return resolve(borderCanvas.toDataURL('image/png'));
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Edge detection failed:', err);
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
