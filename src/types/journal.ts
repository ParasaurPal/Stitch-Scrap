export type TimestampPosition = 'left' | 'center' | 'right';
export type AutoTimestampSetting = 'none' | 'left' | 'center' | 'right';

export interface MoodItem {
  id: string;
  label: string;
  emoji: string;
  color: string;
  intensity: number; // 1 - 100%
  note?: string;
  isCustom?: boolean;
}

export interface CurrentlyListening {
  song: string;
  artist: string;
  coverUrl?: string;
  isPlaying?: boolean;
}

export interface CurrentlyReading {
  title: string;
  author: string;
  progress: string; // e.g. "Page 142 / 380"
  rating?: number; // 1-5
}

export interface BlogMetadata {
  mood: MoodItem;
  moods?: MoodItem[];
  currentlyListening: CurrentlyListening;
  currentlyReading: CurrentlyReading;
  currentlyWatching?: string;
  location?: string;
  weather?: {
    condition: string;
    temp: string;
    icon: string;
  };
  currentlyEating?: string;
  currentObsession?: string;
}

export type StickerFilter =
  | 'none'
  | 'vintage'
  | 'sepia'
  | 'monochrome'
  | 'warm'
  | 'cyan'
  | 'polaroid'
  | 'highcontrast';

export type StickerTexture =
  | 'none'
  | 'glossy'
  | 'holographic'
  | 'matte'
  | 'crinkled'
  | 'glitter'
  | 'acetate';

export type StickerBorder =
  | 'diecut'
  | 'polaroid'
  | 'stamp'
  | 'gold'
  | 'neon'
  | 'none';

export type StickerBorderPattern =
  | 'solid'
  | 'dashed'
  | 'dotted'
  | 'double'
  | 'groove'
  | 'ridge'
  | 'inset'
  | 'outset';

export interface PlacedSticker {
  id: string;
  src: string;
  alt: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // px
  height: number; // px
  rotation: number; // degrees
  scale: number;
  zIndex: number;
  filter: StickerFilter;
  texture: StickerTexture;
  borderStyle: StickerBorder;
  /** Surrounding border thickness in px (plain white solid is the default option). */
  borderWidth?: number;
  /** CSS border color, e.g. #ffffff. */
  borderColor?: string;
  /** CSS border pattern/style. */
  borderPattern?: StickerBorderPattern;
  isFlippedX?: boolean;
  isLocked?: boolean;
  caption?: string;
  timestamp?: string;
  timestampPosition?: TimestampPosition;
}

export type TapePattern =
  | 'grid'
  | 'dots'
  | 'stripes'
  | 'kraft'
  | 'caution'
  | 'lavender'
  | 'frosted'
  | 'cyan';

export interface PlacedTape {
  id: string;
  x: number;
  y: number;
  width: number; // px
  height: number; // px
  rotation: number; // degrees
  pattern: TapePattern;
  text: string;
  textColor: string;
  fontFamily: 'handwriting' | 'marker' | 'typewriter' | 'mono' | 'doodle';
  zIndex: number;
  opacity: number;
  isLocked?: boolean;
  timestamp?: string;
  timestampPosition?: TimestampPosition;
}

export type PaperTextureType =
  | 'math-grid-stars'
  | 'pink-grid-wavy'
  | 'lavender-grid-wavy'
  | 'strawberry-gingham'
  | 'vintage-torn-collage'
  | 'lined'
  | 'grid'
  | 'dot'
  | 'kraft'
  | 'night'
  | 'blush';

export interface JournalEntry {
  id: string;
  journalId: string;
  title: string;
  date: string;
  content: string;
  fontFamily: 'handwriting' | 'marker' | 'typewriter' | 'doodle' | 'sans';
  fontSize: number;
  textColor: string;
  paperTexture: PaperTextureType;
  blogMetadata: BlogMetadata;
  stickers: PlacedSticker[];
  tapes: PlacedTape[];
  createdAt: string;
  updatedAt: string;
}

export interface Journal {
  id: string;
  name: string;
  description: string;
  themeColor: string; // e.g. #f472b6 or #8a5a44
  coverImage?: string; // cover image theme ID or URL
  icon: string;
  defaultPaper: PaperTextureType;
  coverPattern?: string;
  entryCount?: number;
  createdAt: string;
}
