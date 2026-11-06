// High quality SVG sticker data URLs and definitions
export interface StockSticker {
  id: string;
  name: string;
  category: 'nostalgia' | 'nature' | 'cafe' | 'retro-tech' | 'stamps' | 'cute';
  svgDataUrl: string;
  defaultWidth: number;
  defaultHeight: number;
}

// Helper to encode SVG to data URL
const svgToDataUrl = (svgString: string) => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
};

export const STOCK_STICKERS: StockSticker[] = [
  // Retro & Nostalgia
  {
    id: 'retro-cassette',
    name: 'Mixtape Cassette',
    category: 'retro-tech',
    defaultWidth: 140,
    defaultHeight: 90,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" fill="none">
        <rect x="5" y="5" width="150" height="90" rx="8" fill="#F472B6" stroke="#1E293B" stroke-width="4"/>
        <rect x="25" y="18" width="110" height="52" rx="4" fill="#FDF2F8" stroke="#1E293B" stroke-width="3"/>
        <rect x="42" y="32" width="76" height="26" rx="13" fill="#E2E8F0" stroke="#1E293B" stroke-width="3"/>
        <circle cx="56" cy="45" r="9" fill="#1E293B"/>
        <circle cx="56" cy="45" r="4" fill="#F8FAFC"/>
        <circle cx="104" cy="45" r="9" fill="#1E293B"/>
        <circle cx="104" cy="45" r="4" fill="#F8FAFC"/>
        <line x1="32" y1="26" x2="128" y2="26" stroke="#94A3B8" stroke-width="2" stroke-dasharray="4 2"/>
        <text x="80" y="25" font-family="monospace" font-size="7" font-weight="bold" fill="#475569" text-anchor="middle">SIDE A • NOSTALGIA</text>
        <polygon points="40,86 55,74 105,74 120,86" fill="#EC4899" stroke="#1E293B" stroke-width="2.5"/>
        <circle cx="65" cy="81" r="3" fill="#1E293B"/>
        <circle cx="95" cy="81" r="3" fill="#1E293B"/>
      </svg>
    `),
  },
  {
    id: 'vinyl-record',
    name: 'Vinyl Record',
    category: 'nostalgia',
    defaultWidth: 110,
    defaultHeight: 110,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="56" fill="#1E1E24" stroke="#334155" stroke-width="3"/>
        <circle cx="60" cy="60" r="48" stroke="#334155" stroke-width="1" stroke-dasharray="2 3"/>
        <circle cx="60" cy="60" r="40" stroke="#475569" stroke-width="1"/>
        <circle cx="60" cy="60" r="32" stroke="#334155" stroke-width="1" stroke-dasharray="3 3"/>
        <circle cx="60" cy="60" r="22" fill="#F43F5E"/>
        <circle cx="60" cy="60" r="6" fill="#F8FAFC" stroke="#0F172A" stroke-width="2"/>
        <text x="60" y="58" font-family="sans-serif" font-size="4" font-weight="bold" fill="#FFF" text-anchor="middle">VIBES 45</text>
      </svg>
    `),
  },
  {
    id: 'vintage-polaroid-camera',
    name: 'Instant Film Camera',
    category: 'retro-tech',
    defaultWidth: 120,
    defaultHeight: 110,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 120" fill="none">
        <rect x="10" y="24" width="120" height="86" rx="14" fill="#FEF08A" stroke="#1E293B" stroke-width="4"/>
        <path d="M10 52 L130 52" stroke="#1E293B" stroke-width="3"/>
        <rect x="25" y="10" width="30" height="15" rx="3" fill="#E2E8F0" stroke="#1E293B" stroke-width="3"/>
        <circle cx="70" cy="74" r="28" fill="#E2E8F0" stroke="#1E293B" stroke-width="4"/>
        <circle cx="70" cy="74" r="18" fill="#0F172A"/>
        <circle cx="74" cy="70" r="6" fill="#38BDF8"/>
        <circle cx="76" cy="68" r="2.5" fill="#FFF"/>
        <rect x="105" y="34" width="15" height="10" rx="2" fill="#EF4444" stroke="#1E293B" stroke-width="2"/>
        <line x1="20" y1="42" x2="45" y2="42" stroke="#38BDF8" stroke-width="4"/>
        <line x1="20" y1="46" x2="45" y2="46" stroke="#4ADE80" stroke-width="4"/>
      </svg>
    `),
  },
  // Cafe & Comfort
  {
    id: 'matcha-latte',
    name: 'Iced Matcha Latte',
    category: 'cafe',
    defaultWidth: 90,
    defaultHeight: 130,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" fill="none">
        <path d="M25 40 L32 135 C32 142 40 146 50 146 C60 146 68 142 68 135 L75 40 Z" fill="#BBF7D0" stroke="#1E293B" stroke-width="4"/>
        <path d="M28 85 L32 135 C32 142 40 146 50 146 C60 146 68 142 68 135 L72 85 Z" fill="#4ADE80"/>
        <rect x="20" y="32" width="60" height="12" rx="6" fill="#F8FAFC" stroke="#1E293B" stroke-width="3.5"/>
        <line x1="55" y1="12" x2="55" y2="70" stroke="#FB7185" stroke-width="5" stroke-linecap="round"/>
        <circle cx="50" cy="98" r="6" fill="#15803D" opacity="0.4"/>
        <circle cx="42" cy="115" r="5" fill="#15803D" opacity="0.4"/>
        <circle cx="58" cy="120" r="4.5" fill="#15803D" opacity="0.4"/>
        <circle cx="45" cy="62" r="7" fill="#FFF" opacity="0.7"/>
      </svg>
    `),
  },
  {
    id: 'croissant',
    name: 'Golden Croissant',
    category: 'cafe',
    defaultWidth: 120,
    defaultHeight: 85,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" fill="none">
        <path d="M15 50 C25 25 50 15 65 15 C80 15 105 25 115 50 C110 65 95 72 80 62 C70 56 60 56 50 62 C35 72 20 65 15 50 Z" fill="#F59E0B" stroke="#78350F" stroke-width="3.5"/>
        <path d="M40 28 C48 38 48 50 42 60" stroke="#B45309" stroke-width="3" stroke-linecap="round"/>
        <path d="M65 18 C65 35 65 48 65 58" stroke="#B45309" stroke-width="3" stroke-linecap="round"/>
        <path d="M90 28 C82 38 82 50 88 60" stroke="#B45309" stroke-width="3" stroke-linecap="round"/>
        <circle cx="55" cy="30" r="2" fill="#FEF3C7"/>
        <circle cx="75" cy="35" r="2.5" fill="#FEF3C7"/>
      </svg>
    `),
  },
  // Nature & Botany
  {
    id: 'luna-butterfly',
    name: 'Holographic Butterfly',
    category: 'nature',
    defaultWidth: 120,
    defaultHeight: 100,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 120" fill="none">
        <path d="M70 45 C50 15 15 20 15 55 C15 75 40 85 68 70 Z" fill="#A7F3D0" stroke="#047857" stroke-width="3"/>
        <path d="M70 45 C90 15 125 20 125 55 C125 75 100 85 72 70 Z" fill="#A7F3D0" stroke="#047857" stroke-width="3"/>
        <path d="M68 68 C45 75 25 95 38 110 C50 120 65 95 68 78 Z" fill="#6EE7B7" stroke="#047857" stroke-width="3"/>
        <path d="M72 68 C95 75 115 95 102 110 C90 120 75 95 72 78 Z" fill="#6EE7B7" stroke="#047857" stroke-width="3"/>
        <ellipse cx="70" cy="62" rx="4" ry="24" fill="#065F46"/>
        <path d="M68 40 Q62 25 55 20" stroke="#065F46" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M72 40 Q78 25 85 20" stroke="#065F46" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="48" cy="48" r="8" fill="#FDE047" opacity="0.8"/>
        <circle cx="92" cy="48" r="8" fill="#FDE047" opacity="0.8"/>
      </svg>
    `),
  },
  {
    id: 'cherry-blossom',
    name: 'Sakura Blossom',
    category: 'nature',
    defaultWidth: 100,
    defaultHeight: 100,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <g stroke="#BE185D" stroke-width="2.5">
          <path d="M60 60 C50 35 45 15 60 15 C75 15 70 35 60 60 Z" fill="#FCE7F3"/>
          <path d="M60 60 C85 50 105 45 105 60 C105 75 85 70 60 60 Z" fill="#FCE7F3"/>
          <path d="M60 60 C70 85 75 105 60 105 C45 105 50 85 60 60 Z" fill="#FCE7F3"/>
          <path d="M60 60 C35 70 15 75 15 60 C15 45 35 50 60 60 Z" fill="#FCE7F3"/>
          <path d="M60 60 C40 40 25 25 35 18 C45 10 50 35 60 60 Z" fill="#FBCFE8"/>
          <circle cx="60" cy="60" r="10" fill="#F43F5E"/>
        </g>
        <circle cx="60" cy="60" r="4" fill="#FEF08A"/>
      </svg>
    `),
  },
  {
    id: 'retro-mushroom',
    name: 'Botanical Mushroom',
    category: 'nature',
    defaultWidth: 100,
    defaultHeight: 110,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130" fill="none">
        <path d="M50 70 L48 115 C48 122 72 122 72 115 L70 70 Z" fill="#F5EBE0" stroke="#78350F" stroke-width="3.5"/>
        <path d="M15 70 C15 25 105 25 105 70 C95 76 25 76 15 70 Z" fill="#E11D48" stroke="#78350F" stroke-width="4"/>
        <circle cx="40" cy="48" r="8" fill="#FFF"/>
        <circle cx="68" cy="38" r="10" fill="#FFF"/>
        <circle cx="85" cy="56" r="6" fill="#FFF"/>
        <circle cx="28" cy="62" r="5" fill="#FFF"/>
      </svg>
    `),
  },
  // Stamps & Tickets
  {
    id: 'stamp-admit-one',
    name: 'Admit One Ticket',
    category: 'stamps',
    defaultWidth: 140,
    defaultHeight: 75,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 85" fill="none">
        <path d="M10 10 H150 V35 A8 8 0 0 0 150 50 V75 H10 V50 A8 8 0 0 0 10 35 Z" fill="#FDE047" stroke="#1E293B" stroke-width="3.5"/>
        <line x1="40" y1="12" x2="40" y2="73" stroke="#CA8A04" stroke-width="2" stroke-dasharray="3 3"/>
        <text x="25" y="48" font-family="monospace" font-size="9" font-weight="bold" fill="#854D0E" transform="rotate(-90 25 48)">№ 88204</text>
        <text x="95" y="44" font-family="'Courier Prime', monospace" font-size="14" font-weight="bold" fill="#1E293B" text-anchor="middle">ADMIT ONE</text>
        <text x="95" y="58" font-family="sans-serif" font-size="7" font-weight="bold" fill="#713F12" letter-spacing="2" text-anchor="middle">CINEMA NOSTALGIA</text>
      </svg>
    `),
  },
  {
    id: 'postage-stamp',
    name: 'Vintage Airmail Stamp',
    category: 'stamps',
    defaultWidth: 95,
    defaultHeight: 115,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 130" fill="none">
        <rect x="8" y="8" width="94" height="114" fill="#F8FAFC" stroke="#64748B" stroke-width="2" stroke-dasharray="3 3"/>
        <rect x="14" y="14" width="82" height="102" fill="#E0F2FE" stroke="#0284C7" stroke-width="2"/>
        <polygon points="55,25 75,55 95,65 75,70 55,95 48,72 25,65 48,58" fill="#38BDF8" opacity="0.6"/>
        <text x="55" y="105" font-family="'Courier Prime', monospace" font-size="12" font-weight="bold" fill="#0369A1" text-anchor="middle">25¢ AIRMAIL</text>
        <circle cx="55" cy="55" r="28" stroke="#EF4444" stroke-width="2" stroke-dasharray="5 2" opacity="0.7"/>
        <text x="55" y="58" font-family="sans-serif" font-size="6" font-weight="bold" fill="#DC2626" text-anchor="middle" opacity="0.7">PARIS • 1998</text>
      </svg>
    `),
  },
  {
    id: 'wax-seal',
    name: 'Crimson Wax Seal',
    category: 'stamps',
    defaultWidth: 90,
    defaultHeight: 90,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <path d="M50 8 C62 8 70 12 78 20 C88 28 92 40 90 52 C88 65 80 75 72 84 C62 92 48 94 36 90 C22 84 12 72 10 58 C8 42 16 28 28 18 C36 10 44 8 50 8 Z" fill="#991B1B" stroke="#7F1D1D" stroke-width="3"/>
        <circle cx="50" cy="50" r="28" fill="#B91C1C" stroke="#7F1D1D" stroke-width="2"/>
        <text x="50" y="58" font-family="'Courier Prime', serif" font-size="24" font-weight="bold" fill="#FEE2E2" text-anchor="middle">S</text>
      </svg>
    `),
  },
  // Cute & Aesthetic
  {
    id: 'sleepy-cat',
    name: 'Cozy Loaf Cat',
    category: 'cute',
    defaultWidth: 120,
    defaultHeight: 90,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 95" fill="none">
        <path d="M30 40 L22 22 L40 30 C50 25 70 25 80 30 L98 22 L90 40 C105 50 105 75 90 85 C75 92 45 92 30 85 C15 75 15 50 30 40 Z" fill="#FDBA74" stroke="#7C2D12" stroke-width="3.5"/>
        <path d="M42 55 Q50 60 42 65" stroke="#7C2D12" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M78 55 Q70 60 78 65" stroke="#7C2D12" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="60" cy="62" rx="3" ry="2" fill="#F43F5E"/>
        <line x1="28" y1="58" x2="12" y2="54" stroke="#7C2D12" stroke-width="2"/>
        <line x1="28" y1="64" x2="14" y2="66" stroke="#7C2D12" stroke-width="2"/>
        <line x1="92" y1="58" x2="108" y2="54" stroke="#7C2D12" stroke-width="2"/>
        <line x1="92" y1="64" x2="106" y2="66" stroke="#7C2D12" stroke-width="2"/>
        <path d="M95 72 C115 75 118 60 110 50" stroke="#EA580C" stroke-width="5" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'sparkle-cluster',
    name: 'Y2K Sparkle Trio',
    category: 'cute',
    defaultWidth: 90,
    defaultHeight: 90,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <path d="M45 10 Q45 40 15 40 Q45 40 45 70 Q45 40 75 40 Q45 40 45 10 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="2.5"/>
        <circle cx="45" cy="40" r="4" fill="#FFF"/>
        <path d="M75 55 Q75 70 60 70 Q75 70 75 85 Q75 70 90 70 Q75 70 75 55 Z" fill="#F472B6" stroke="#BE185D" stroke-width="2"/>
        <circle cx="25" cy="70" r="3" fill="#38BDF8"/>
      </svg>
    `),
  },
  {
    id: 'pixel-heart',
    name: '8-Bit Pink Heart',
    category: 'nostalgia',
    defaultWidth: 90,
    defaultHeight: 80,
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 80" fill="none">
        <path d="M20 10 H40 V20 H50 V10 H70 V30 H80 V50 H70 V60 H60 V70 H50 V80 H40 V70 H30 V60 H20 V50 H10 V30 H20 V10 Z" fill="#FB7185" stroke="#881337" stroke-width="4"/>
        <rect x="25" y="20" width="10" height="10" fill="#FFF"/>
      </svg>
    `),
  },
];
