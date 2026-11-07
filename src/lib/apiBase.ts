/**
 * Base URL for the Stitch & Scrap API server (server.ts endpoints).
 * - Dev (local Express/Vite server): leave unset to use relative `/api/*`.
 * - APK / hosted frontend: set VITE_API_BASE_URL to your deployed server origin,
 *   e.g. https://your-server.example.com (no trailing slash).
 */
export function getApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
  return raw.replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
