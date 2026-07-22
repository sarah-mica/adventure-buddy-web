const GEOCODING_ENDPOINT = 'https://api.maptiler.com/geocoding';

export function getMapTilerApiKey() {
  return import.meta.env.VITE_MAPTILER_KEY || '';
}

export async function geocodeLocation(query, nearbyPlaces = []) {
  const apiKey = getMapTilerApiKey();
  if (!apiKey) return [];

  const nearbyParams = nearbyPlaces
    .filter((item) => item.lat != null && item.lng != null)
    .slice(0, 3)
    .map((item) => `lat=${item.lat}&lon=${item.lng}`)
    .join('&');

  const url = `${GEOCODING_ENDPOINT}/${encodeURIComponent(query)}.json?fuzzy=true&limit=8&key=${apiKey}${nearbyParams ? `&${nearbyParams}` : ''}`;
  const response = await fetch(url);
  const data = await response.json();

  return Array.isArray(data?.features)
    ? data.features
        .map((feature) => ({
          id: feature.id,
          label: feature.place_name || feature.text || feature.properties?.name || '',
          lat: feature.geometry?.coordinates?.[1] ?? null,
          lng: feature.geometry?.coordinates?.[0] ?? null,
        }))
        .filter((item) => item.label)
    : [];
}
