# Stitch & Scrap AI sticker server

The native APK does not contain a Gemini API key. AI sticker generation and Gemini background removal call the Express API in `server.ts`, which must run on a hosted server.

## Render setup

Create a **Web Service** for the repository `ParasaurPal/Stitch-Scrap` with:

- **Name:** `stitch-and-scrap`
- **Branch:** `main`
- **Runtime:** Node
- **Root directory:** leave blank
- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Instance:** Free is sufficient for initial testing (the service may sleep when idle)

In the Render service's **Environment** section, add:

- **Key:** `GEMINI_API_KEY`
- **Value:** your Gemini API key

Save the environment variable and deploy. Do not put the Gemini key in the Android app, GitHub source, or a message.

## Connect the Android app

1. Open a scrapbook page and tap the sticker button.
2. In **AI sticker generator**, enter the public Render service URL, for example `https://your-service.onrender.com`.
3. Enter a sticker description and tap **Generate AI sticker**.

The URL must be the service's root URL, without an `/api` suffix. The app appends `/api/generate-sticker` and `/api/ai-edge-detection` automatically. The URL is saved on the device.

## API routes

- `POST /api/generate-sticker` — creates a sticker image with Gemini.
- `POST /api/ai-edge-detection` — sends an uploaded photo to Gemini for subject isolation.

Both routes are already implemented in `server.ts`. The browser app can continue using `VITE_API_BASE_URL`; the native app has its own server URL field in the sticker studio.
