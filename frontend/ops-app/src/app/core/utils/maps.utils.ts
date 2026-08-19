/**
 * Utilidades para generar enlaces universales a Google Maps y Waze
 * compatibles con navegadores web, Android e iOS a través de Capacitor.
 */

export function buildGoogleMapsUrl(addressOrQuery?: string | null, lat?: number | null, lng?: number | null): string {
  if (lat != null && lng != null && (lat !== 0 || lng !== 0)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (!addressOrQuery || !addressOrQuery.trim()) {
    return 'https://www.google.com/maps';
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOrQuery.trim())}`;
}

export function buildWazeUrl(lat?: number | null, lng?: number | null, addressOrQuery?: string | null): string {
  if (lat != null && lng != null && (lat !== 0 || lng !== 0)) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }
  if (!addressOrQuery || !addressOrQuery.trim()) {
    return 'https://waze.com';
  }
  return `https://waze.com/ul?q=${encodeURIComponent(addressOrQuery.trim())}`;
}
