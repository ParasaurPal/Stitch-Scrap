import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // API endpoint for generating AI stickers/photos
  app.post('/api/generate-sticker', async (req, res) => {
    try {
      const {
        prompt,
        aspectRatio = '1:1',
        imageSize = '1K',
        model = 'gemini-3-pro-image-preview',
        isDieCutSticker = true,
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is not configured in environment. Please add it to Settings > Secrets.',
        });
      }

      // Format prompt for scrapbooking / stickers if requested
      const enhancedPrompt = isDieCutSticker
        ? `Die-cut aesthetic scrapbooking sticker of ${prompt}. Clean white border contour, high quality sticker art, vibrant colors, isolated on solid white background, cute sticker illustration.`
        : prompt;

      // Primary model selection (gemini-3-pro-image-preview or gemini-nano-banana-2.1)
      const selectedModel = model || 'gemini-3-pro-image-preview';

      try {
        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: {
            parts: [{ text: enhancedPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
              imageSize: imageSize as any,
            },
          },
        });

        let imageUrl: string | null = null;
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const base64 = part.inlineData.data;
            const mime = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mime};base64,${base64}`;
            break;
          }
        }

        if (imageUrl) {
          return res.json({ success: true, imageUrl, model: selectedModel, aspectRatio, imageSize });
        } else {
          return res.status(500).json({ error: 'No image data returned from model' });
        }
      } catch (innerError: any) {
        console.error('Error generating with primary model, attempting fallback:', innerError?.message);

        // Fallback to gemini-nano-banana-2.1 or gemini-3.1-flash-lite-image if primary failed
        const fallbackModel = selectedModel === 'gemini-3-pro-image-preview' ? 'gemini-nano-banana-2.1' : 'gemini-3.1-flash-lite-image';
        try {
          const fallbackConfig: any = {};
          if (fallbackModel === 'gemini-nano-banana-2.1') {
            fallbackConfig.imageConfig = {
              aspectRatio: aspectRatio as any,
              imageSize: imageSize as any,
            };
          } else {
            // gemini-3.1-flash-lite-image supports standard aspect ratios
            const standardAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
            fallbackConfig.imageConfig = {
              aspectRatio: standardAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1',
            };
          }

          const fallbackResponse = await ai.models.generateContent({
            model: fallbackModel,
            contents: {
              parts: [{ text: enhancedPrompt }],
            },
            config: fallbackConfig,
          });

          let imageUrl: string | null = null;
          for (const part of fallbackResponse.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData?.data) {
              const base64 = part.inlineData.data;
              const mime = part.inlineData.mimeType || 'image/png';
              imageUrl = `data:${mime};base64,${base64}`;
              break;
            }
          }

          if (imageUrl) {
            return res.json({ success: true, imageUrl, model: fallbackModel, aspectRatio, imageSize });
          } else {
            throw new Error(innerError?.message || 'Failed to generate image');
          }
        } catch (fbError: any) {
          return res.status(500).json({
            error: fbError?.message || innerError?.message || 'Error communicating with Gemini Image model',
          });
        }
      }
    } catch (err: any) {
      console.error('Sticker generation endpoint error:', err);
      const isQuota = err?.status === 429 || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('quota');
      return res.status(isQuota ? 429 : 500).json({
        error: isQuota
          ? 'Free tier quota reached for Gemini Image model. Please select a billing-enabled API key in Settings > Secrets, or use our curated stock sticker library and uploaded photos.'
          : err?.message || 'Server error generating sticker',
        isQuotaError: isQuota,
      });
    }
  });

  // API endpoint for AI edge detection on custom uploaded photos
  app.post('/api/ai-edge-detection', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/png' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is not configured in environment.',
        });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: 'Perform accurate edge detection to isolate the main subject in this image. Remove all background completely, and render the subject as a die-cut physical scrapbooking sticker with a smooth solid white contour border on a clean isolated background.',
            },
          ],
        },
      });

      let imageUrl: string | null = null;
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const base64 = part.inlineData.data;
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${base64}`;
          break;
        }
      }

      if (imageUrl) {
        return res.json({ success: true, imageUrl });
      } else {
        return res.status(500).json({ error: 'Failed to extract subject with AI edge detection' });
      }
    } catch (err: any) {
      console.error('AI Edge detection endpoint error:', err);
      const isQuota = err?.status === 429 || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('quota');
      return res.status(isQuota ? 429 : 500).json({
        error: isQuota
          ? 'Neural edge detection quota reached on free tier. Using automatic high-precision smart edge detection locally.'
          : err?.message || 'Server error during edge detection',
        isQuotaError: isQuota,
      });
    }
  });

  // Vite middlewares or static files
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Native Android Journal Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
