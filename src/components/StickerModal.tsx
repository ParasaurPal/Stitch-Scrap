import React, { useState, useEffect } from 'react';
import { X, Sparkles, Image, Upload, Wand2, Check, Loader2, Bookmark, Scissors, Sliders, RefreshCw, Layers } from 'lucide-react';
import { STOCK_STICKERS, StockSticker } from '../data/stickers';
import { processImageEdgeDetection, EdgeDetectionPoint } from '../utils/edgeDetection';
import { SubjectLassoSelector } from './SubjectLassoSelector';
import { StickerTexture, StickerBorderPattern } from '../types/journal';
import { sounds } from '../utils/sound';
import { apiUrl } from '../lib/apiBase';

interface StickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSticker: (stickerData: {
    src: string;
    alt: string;
    width: number;
    height: number;
    borderStyle: 'diecut' | 'polaroid' | 'stamp' | 'gold' | 'neon' | 'none';
    texture: 'none' | 'glossy' | 'holographic' | 'matte' | 'crinkled' | 'glitter' | 'acetate';
    borderWidth?: number;
    borderColor?: string;
    borderPattern?: StickerBorderPattern;
  }) => void;
  customStickers: any[];
  onSaveToStash: (sticker: any) => void;
  themeColor: string;
}

export const StickerModal: React.FC<StickerModalProps> = ({
  isOpen,
  onClose,
  onAddSticker,
  customStickers,
  onSaveToStash,
  themeColor,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'stock' | 'upload'>('ai');

  // AI Generator state
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<string>('gemini-3-pro-image-preview');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [isDieCut, setIsDieCut] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Upload state & AI Edge Detection
  const [rawUploadedImage, setRawUploadedImage] = useState<string | null>(null);
  const [processedStickerImage, setProcessedStickerImage] = useState<string | null>(null);
  const [useEdgeDetection, setUseEdgeDetection] = useState<boolean>(true);
  const [edgeThreshold, setEdgeThreshold] = useState<number>(26);
  const [borderThickness, setBorderThickness] = useState<number>(8); // baked contour (edge detection)
  const [isProcessingEdge, setIsProcessingEdge] = useState<boolean>(false);
  const [isNeuralProcessing, setIsNeuralProcessing] = useState<boolean>(false);
  const [uploadTexture, setUploadTexture] = useState<StickerTexture>('glossy');
  const [uploadBorder, setUploadBorder] = useState<'diecut' | 'polaroid' | 'stamp'>('diecut');
  const [canvasBorderWidth, setCanvasBorderWidth] = useState<number>(4);
  const [canvasBorderPattern, setCanvasBorderPattern] = useState<StickerBorderPattern>('solid');
  const [canvasBorderColor, setCanvasBorderColor] = useState<string>('#ffffff');
  const [edgeError, setEdgeError] = useState<string | null>(null);
  const [lassoPoints, setLassoPoints] = useState<EdgeDetectionPoint[]>([]);

  // Category filter for stock
  const [stockCategory, setStockCategory] = useState<string>('all');

  if (!isOpen) return null;

  const aspectRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
  const imageSizes = ['1K', '2K', '4K'];

  const promptSuggestions = [
    'Vintage matcha latte cat with sakura blossoms',
    '90s holographic cyber butterfly with sparkles',
    'Retro film camera surrounded by daisies',
    'Japanese postage stamp of Mount Fuji at night',
    'Cute sleepy croissant with little chef hat',
    'Y2K pink flip phone with heart stickers',
    'Botanical pressed ferns in glass vial',
    'Cozy autumn coffee mug with floating steam heart',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenError(null);
    sounds.playClick();

    try {
      const response = await fetch(apiUrl('/api/generate-sticker'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          aspectRatio,
          imageSize,
          isDieCutSticker: isDieCut,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error || 'Failed to generate sticker');
      }

      setGeneratedImage(data.imageUrl);
      sounds.playStickerPop();

      // Automatically save to custom sticker stash for cloud sync
      onSaveToStash({
        id: `ai-${Date.now()}`,
        name: prompt.slice(0, 30),
        imageUrl: data.imageUrl,
        model,
        aspectRatio,
        imageSize,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Sticker generation error:', err?.message);
      const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
      setGenError(
        isQuota
          ? 'Daily free tier limit reached. You can pick from our 60+ curated scrapbook stickers, or upload your own photos with Guided Subject Cutout!'
          : (err.message || 'Error creating sticker')
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Process edge detection on upload
  const triggerEdgeDetection = async (imgSrc: string, threshold: number, borderW: number, selectionPoints: EdgeDetectionPoint[] = lassoPoints) => {
    setIsProcessingEdge(true);
    setEdgeError(null);
    try {
      const processed = await processImageEdgeDetection(imgSrc, {
        threshold,
        smoothing: 2,
        borderWidth: borderW,
        borderColor: '#ffffff',
        addShadow: true,
        selectionPoints: selectionPoints.length >= 8 ? selectionPoints : undefined,
      });
      setProcessedStickerImage(processed);
    } catch (err: any) {
      console.error(err);
      setEdgeError('Local edge detection error');
    } finally {
      setIsProcessingEdge(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const raw = event.target?.result as string;
        setRawUploadedImage(raw);
        setLassoPoints([]);
        sounds.playClick();
        if (useEdgeDetection) {
          await triggerEdgeDetection(raw, edgeThreshold, borderThickness);
        } else {
          setProcessedStickerImage(raw);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Gemini Neural Edge Detection
  const handleRunGeminiEdgeDetection = async () => {
    if (!rawUploadedImage) return;
    setIsNeuralProcessing(true);
    setEdgeError(null);
    sounds.playClick();
    try {
      const response = await fetch(apiUrl('/api/ai-edge-detection'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: rawUploadedImage,
          mimeType: 'image/png',
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error || 'Gemini edge detection failed');
      }
      setProcessedStickerImage(data.imageUrl);
      sounds.playStickerPop();
    } catch (err: any) {
      console.warn('Neural edge detection notice:', err?.message);
      const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
      setEdgeError(
        isQuota
          ? 'Free tier quota reached for neural model. High-precision smart edge detection has seamlessly extracted your sticker locally!'
          : (err.message || 'Gemini edge detection notice: falling back to smart edge detection')
      );
      // Fallback to local
      await triggerEdgeDetection(rawUploadedImage, edgeThreshold, borderThickness);
    } finally {
      setIsNeuralProcessing(false);
    }
  };

  const handleAddGeneratedToPage = () => {
    if (!generatedImage) return;
    sounds.playStickerPop();
    onAddSticker({
      src: generatedImage,
      alt: prompt || 'AI Generated Sticker',
      width: 130,
      height: 130,
      borderStyle: isDieCut ? 'diecut' : 'polaroid',
      texture: 'glossy',
      borderWidth: 4,
      borderColor: '#ffffff',
      borderPattern: 'solid',
    });
    onClose();
  };

  const handleAddStock = (stock: StockSticker) => {
    sounds.playStickerPop();
    onAddSticker({
      src: stock.svgDataUrl,
      alt: stock.name,
      width: stock.defaultWidth,
      height: stock.defaultHeight,
      borderStyle: 'diecut',
      texture: stock.category === 'nature' ? 'holographic' : 'glossy',
      borderWidth: 4,
      borderColor: '#ffffff',
      borderPattern: 'solid',
    });
    onClose();
  };

  const handleAddUploaded = () => {
    const finalImage = (useEdgeDetection && processedStickerImage) ? processedStickerImage : (rawUploadedImage || '');
    if (!finalImage) return;
    sounds.playStickerPop();

    // Add to journal canvas
    onAddSticker({
      src: finalImage,
      alt: 'Custom Uploaded Sticker',
      width: 140,
      height: 140,
      borderStyle: useEdgeDetection ? 'none' : uploadBorder,
      texture: uploadTexture,
      borderWidth: canvasBorderWidth,
      borderColor: canvasBorderColor,
      borderPattern: canvasBorderPattern,
    });

    // Save to custom sticker stash so it syncs across user devices
    onSaveToStash({
      id: `custom-${Date.now()}`,
      name: 'Custom Cutout Sticker',
      imageUrl: finalImage,
      model: 'ai-edge-detection',
      aspectRatio: '1:1',
      imageSize: '1K',
      createdAt: new Date().toISOString(),
    });

    onClose();
  };

  const filteredStock =
    stockCategory === 'all'
      ? STOCK_STICKERS
      : STOCK_STICKERS.filter((s) => s.category === stockCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-xl bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in slide-in-from-bottom duration-200">
        {/* Android Sheet Top Handle & Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/90">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: themeColor || '#ec4899' }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">Sticker & Photo Studio</h2>
              <p className="text-[11px] text-stone-400">Add physical stickers, AI art & polaroids</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/50 p-1 text-xs">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('ai');
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Wand2 size={14} />
            AI Sticker Generator
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('stock');
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition ${
              activeTab === 'stock'
                ? 'bg-stone-800 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Image size={14} />
            Curated Stash
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('upload');
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition ${
              activeTab === 'upload'
                ? 'bg-stone-800 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Upload size={14} />
            Upload Photo
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: AI GENERATOR */}
          {activeTab === 'ai' && (
            <div className="space-y-3.5">
              {/* Prompt Input */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  What sticker would you like to create?
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Vintage Japanese matcha cat, 90s holographic butterfly..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-pink-500 transition"
                  />
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                  Idea Sparks
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {promptSuggestions.slice(0, 4).map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        sounds.playClick();
                        setPrompt(s);
                      }}
                      className="text-[10px] bg-stone-800/80 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded-lg border border-stone-700/60 truncate max-w-[240px]"
                    >
                      ✨ {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model & Die-Cut format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                    Image Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-none"
                  >
                    <option value="gemini-3-pro-image-preview">
                      gemini-3-pro-image-preview (Studio Quality)
                    </option>
                    <option value="gemini-nano-banana-2.1">gemini-nano-banana-2.1 (Fast)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between bg-stone-950 border border-stone-800 rounded-xl px-3 py-2">
                  <div>
                    <span className="text-xs font-semibold text-stone-200 block">Die-Cut Sticker</span>
                    <span className="text-[10px] text-stone-400">Clean white contour border</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDieCut}
                    onChange={(e) => setIsDieCut(e.target.checked)}
                    className="w-4 h-4 accent-pink-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Aspect Ratio & Resolution Affordances */}
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-stone-400">Aspect Ratio</span>
                    <span className="text-[10px] text-stone-500 font-mono">Current: {aspectRatio}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {aspectRatios.map((ar) => (
                      <button
                        key={ar}
                        onClick={() => {
                          sounds.playClick();
                          setAspectRatio(ar);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono transition ${
                          aspectRatio === ar
                            ? 'bg-pink-600 text-white font-bold ring-1 ring-white/20'
                            : 'bg-stone-950 text-stone-400 hover:bg-stone-800 border border-stone-800'
                        }`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-stone-400">Image Resolution Size</span>
                    <span className="text-[10px] text-stone-500 font-mono">Current: {imageSize}</span>
                  </div>
                  <div className="flex gap-2">
                    {imageSizes.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => {
                          sounds.playClick();
                          setImageSize(sz);
                        }}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                          imageSize === sz
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-stone-950 text-stone-400 hover:bg-stone-800 border border-stone-800'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                disabled={isGenerating || !prompt.trim()}
                onClick={handleGenerate}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-90 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating with {model}...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Physical Sticker
                  </>
                )}
              </button>

              {genError && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-[11px] text-rose-200">
                  {genError}
                </div>
              )}

              {/* Generated Image Preview */}
              {generatedImage && (
                <div className="mt-3 p-3 bg-stone-950 rounded-2xl border border-stone-800 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 mb-2 flex items-center gap-1">
                    <Check size={12} /> Sticker Created Successfully!
                  </span>
                  <div className="relative max-h-56 overflow-hidden rounded-xl border border-white/10 p-2 bg-stone-900">
                    <img
                      src={generatedImage}
                      alt="Generated Sticker"
                      className="max-h-48 object-contain rounded-lg border-diecut"
                    />
                  </div>
                  <button
                    onClick={handleAddGeneratedToPage}
                    className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <Sparkles size={14} />
                    Place on Journal Page
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CURATED STASH & SAVED STICKERS */}
          {activeTab === 'stock' && (
            <div className="space-y-3">
              {/* Category filter */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'All Stickers' },
                  { id: 'nostalgia', label: 'Nostalgia' },
                  { id: 'cafe', label: 'Cafe & Treats' },
                  { id: 'nature', label: 'Nature' },
                  { id: 'retro-tech', label: 'Retro Tech' },
                  { id: 'stamps', label: 'Stamps & Tickets' },
                  { id: 'cute', label: 'Cute' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      sounds.playClick();
                      setStockCategory(c.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition ${
                      stockCategory === c.id
                        ? 'bg-pink-600 text-white font-bold'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* User's custom generated stickers if any */}
              {customStickers && customStickers.length > 0 && stockCategory === 'all' && (
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1 mb-2">
                    <Bookmark size={12} /> My Cloud-Synced AI Stickers
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {customStickers.map((cs) => (
                      <div
                        key={cs.id}
                        onClick={() => {
                          sounds.playStickerPop();
                          onAddSticker({
                            src: cs.imageUrl,
                            alt: cs.name,
                            width: 120,
                            height: 120,
                            borderStyle: 'diecut',
                            texture: 'glossy',
                            borderWidth: 4,
                            borderColor: '#ffffff',
                            borderPattern: 'solid',
                          });
                          onClose();
                        }}
                        className="group bg-stone-950 border border-stone-800 hover:border-pink-500 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer transition active:scale-95"
                      >
                        <img
                          src={cs.imageUrl}
                          alt={cs.name}
                          className="h-16 w-16 object-contain rounded drop-shadow"
                        />
                        <span className="text-[9px] text-stone-400 truncate w-full text-center mt-1">
                          {cs.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Sticker Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {filteredStock.map((sticker) => (
                  <div
                    key={sticker.id}
                    onClick={() => handleAddStock(sticker)}
                    className="group bg-stone-950 border border-stone-800 hover:border-pink-500 rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer transition active:scale-95 hover:shadow-lg"
                  >
                    <img
                      src={sticker.svgDataUrl}
                      alt={sticker.name}
                      className="h-16 w-16 object-contain drop-shadow transition group-hover:scale-105"
                    />
                    <span className="text-[10px] font-medium text-stone-300 text-center mt-1.5 truncate w-full">
                      {sticker.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD PHOTO WITH AI EDGE DETECTION */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-stone-700 hover:border-pink-500 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer bg-stone-950 transition group">
                <Upload size={28} className="text-stone-400 group-hover:text-pink-400 mb-1.5 transition" />
                <span className="text-xs font-bold text-stone-200">Upload Photo to Turn into Sticker</span>
                <span className="text-[10px] text-stone-500 mt-0.5">PNG, JPG, WEBP • AI edge detection extracts subject</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {rawUploadedImage && (
                <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-3.5">
                  {/* Mode Toggle: Subject Edge Cutout vs Framed Photo */}
                  <div className="flex items-center justify-between bg-stone-900 p-1.5 rounded-xl text-xs">
                    <button
                      onClick={async () => {
                        sounds.playClick();
                        setUseEdgeDetection(true);
                        await triggerEdgeDetection(rawUploadedImage, edgeThreshold, borderThickness);
                      }}
                      className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                        useEdgeDetection
                          ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Scissors size={13} />
                      AI Edge Cutout
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setUseEdgeDetection(false);
                      }}
                      className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                        !useEdgeDetection
                          ? 'bg-stone-800 text-white shadow'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Image size={13} />
                      Framed Photo
                    </button>
                  </div>

                  {/* AI Edge Detection Controls */}
                  {useEdgeDetection ? (
                    <div className="space-y-3 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                          <Scissors size={14} /> Subject Edge Detection Settings
                        </span>
                        {isProcessingEdge && (
                          <span className="text-[10px] text-pink-300 flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin" /> Detecting...
                          </span>
                        )}
                      </div>

                      <SubjectLassoSelector
                        imageSrc={rawUploadedImage}
                        onSelectionChange={setLassoPoints}
                      />
                      {lassoPoints.length >= 8 && (
                        <button
                          type="button"
                          onClick={() => triggerEdgeDetection(rawUploadedImage, edgeThreshold, borderThickness, lassoPoints)}
                          disabled={isProcessingEdge}
                          className="w-full py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2"
                        >
                          <Scissors size={14} /> Apply guided subject cutout
                        </button>
                      )}

                      {/* Sensitivity Threshold Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] text-stone-300 mb-1">
                          <span>Subject Edge Sensitivity:</span>
                          <span className="font-mono text-pink-400">{edgeThreshold}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="65"
                          value={edgeThreshold}
                          onChange={async (e) => {
                            const val = Number(e.target.value);
                            setEdgeThreshold(val);
                            await triggerEdgeDetection(rawUploadedImage, val, borderThickness, lassoPoints);
                          }}
                          className="w-full accent-pink-500 cursor-pointer"
                        />
                      </div>

                      {/* White Sticker Contour Border Thickness */}
                      <div>
                        <div className="flex justify-between text-[11px] text-stone-300 mb-1">
                          <span>Die-Cut White Contour Border:</span>
                          <span className="font-mono text-purple-400">{borderThickness}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="16"
                          value={borderThickness}
                          onChange={async (e) => {
                            const val = Number(e.target.value);
                            setBorderThickness(val);
                            await triggerEdgeDetection(rawUploadedImage, edgeThreshold, val, lassoPoints);
                          }}
                          className="w-full accent-purple-500 cursor-pointer"
                        />
                      </div>

                      {/* Deep Gemini Neural Cutout Option */}
                      <button
                        disabled={isNeuralProcessing}
                        onClick={handleRunGeminiEdgeDetection}
                        className="w-full py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-750 text-purple-300 hover:text-purple-200 border border-purple-500/30 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition"
                      >
                        {isNeuralProcessing ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Deep Neural Edge Cutout in progress...
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} className="text-purple-400" />
                            Enhance with Gemini Neural Edge Cutout
                          </>
                        )}
                      </button>

                      {edgeError && (
                        <p className="text-[10px] text-rose-300 bg-rose-950/40 p-1.5 rounded-lg border border-rose-800/40">
                          {edgeError}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Frame Options if Edge Detection is off */
                    <div className="flex items-center justify-between text-xs bg-stone-900/60 p-2.5 rounded-xl border border-stone-800">
                      <span className="font-semibold text-stone-300">Frame Style:</span>
                      <div className="flex gap-1.5">
                        {(['polaroid', 'diecut', 'stamp'] as ('diecut' | 'polaroid' | 'stamp')[]).map(
                          (b) => (
                            <button
                              key={b}
                              onClick={() => setUploadBorder(b)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] capitalize font-medium ${
                                uploadBorder === b
                                  ? 'bg-pink-600 text-white font-bold'
                                  : 'bg-stone-800 text-stone-300'
                              }`}
                            >
                              {b}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Physical Sticker Texture Finish */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      Physical Sticker Texture Finish
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          { id: 'glossy', label: 'Glossy Foil' },
                          { id: 'holographic', label: 'Holographic' },
                          { id: 'matte', label: 'Matte Vinyl' },
                          { id: 'glitter', label: 'Glitter' },
                          { id: 'crinkled', label: 'Crinkled' },
                          { id: 'acetate', label: 'Translucent' },
                        ] as { id: StickerTexture; label: string }[]
                      ).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            sounds.playClick();
                            setUploadTexture(t.id);
                          }}
                          className={`py-1 px-1.5 rounded-lg text-center text-[10px] transition ${
                            uploadTexture === t.id
                              ? 'bg-pink-600 text-white font-bold'
                              : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cutout Preview on Transparency Checkerboard */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-stone-500 mb-1.5">
                      Sticker Cutout Preview
                    </span>
                    <div
                      className="p-4 rounded-xl border border-white/10 flex items-center justify-center max-h-56 max-w-full overflow-hidden"
                      style={{
                        backgroundImage: `linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)`,
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        backgroundColor: '#18181b',
                      }}
                    >
                      <img
                        src={(useEdgeDetection && processedStickerImage) ? processedStickerImage : rawUploadedImage}
                        alt="Uploaded preview"
                        className={`max-h-44 object-contain transition-all ${
                          !useEdgeDetection
                            ? uploadBorder === 'polaroid'
                              ? 'border-polaroid'
                              : uploadBorder === 'diecut'
                              ? 'border-diecut'
                              : 'border-stamp'
                            : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Canvas border: plain white solid (mandatory option) + patterns/thickness */}
                  <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-300 block mb-1">
                      Border on Page (surrounding sticker/image)
                    </span>
                    <p className="text-[9px] text-stone-500 mb-1.5">
                      Plain white solid border available with selectable thickness (px).
                    </p>
                    <label className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] text-stone-400">Thickness</span>
                      <span className="text-[10px] font-mono text-pink-300">{canvasBorderWidth}px</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      step={1}
                      value={canvasBorderWidth}
                      onChange={(e) => setCanvasBorderWidth(Number(e.target.value))}
                      className="w-full accent-pink-500 h-1.5 bg-stone-700 rounded-full"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge'] as StickerBorderPattern[]).map(
                        (p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setCanvasBorderPattern(p);
                            }}
                            className={`px-2 py-1 rounded-lg text-[9px] capitalize transition ${
                              canvasBorderPattern === p
                                ? 'bg-white text-stone-900 font-bold'
                                : 'bg-stone-800 text-stone-300'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {['#ffffff', '#111827', '#f472b6', '#38bdf8'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          title={c === '#ffffff' ? 'Plain white' : c}
                          onClick={() => {
                            sounds.playClick();
                            setCanvasBorderColor(c);
                          }}
                          className={`w-5 h-5 rounded-full border-2 ${
                            canvasBorderColor.toLowerCase() === c ? 'border-pink-400' : 'border-stone-600'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={canvasBorderColor}
                        onChange={(e) => setCanvasBorderColor(e.target.value)}
                        className="w-6 h-5 rounded bg-transparent cursor-pointer border border-stone-600"
                        title="Custom color"
                      />
                    </div>
                  </div>

                  {/* Place on Journal Page Button */}
                  <button
                    onClick={handleAddUploaded}
                    className="w-full py-2.5 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:opacity-90 active:scale-98 text-white font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={15} />
                    Place Cutout Sticker on Page
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
