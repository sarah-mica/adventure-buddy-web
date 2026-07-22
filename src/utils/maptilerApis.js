const GEOCODING_ENDPOINT = 'https://api.maptiler.com/geocoding';
const SEARCHBOX_ENDPOINT = 'https://api.maptiler.com/search/searchbox/v1';

export function getMapTilerApiKey() {
  return import.meta.env.VITE_MAPTILER_KEY || '';
}

function getProximityParam(nearbyPlaces = []) {
  const firstNearby = nearbyPlaces.find((item) => item.lat != null && item.lng != null);
  if (!firstNearby) return '';
  return `${Number(firstNearby.lng)},${Number(firstNearby.lat)}`;
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

export async function searchLocation(query, nearbyPlaces = []) {
  const apiKey = getMapTilerApiKey();
  if (!apiKey || !query?.trim()) return [];

  const params = new URLSearchParams({
    q: query.trim(),
    limit: '8',
    key: apiKey,
    language: 'en',
  });

  const proximity = getProximityParam(nearbyPlaces);
  if (proximity) {
    params.set('proximity', proximity);
  }

  try {
    const response = await fetch(`${SEARCHBOX_ENDPOINT}/suggest?${params.toString()}`);
    if (!response.ok) throw new Error(`Search Box request failed with status ${response.status}`);

    const data = await response.json();
    const suggestions = Array.isArray(data?.suggestions)
      ? data.suggestions
          .map((suggestion) => ({
            id: suggestion.mapbox_id || suggestion.id || `${suggestion.name || 'suggestion'}-${suggestion.feature_type || 'result'}`,
            mapboxId: suggestion.mapbox_id || '',
            label: suggestion.name || suggestion.full_address || suggestion.place_formatted || '',
            lat: null,
            lng: null,
          }))
          .filter((item) => item.label)
      : [];

    if (suggestions.length > 0) {
      return suggestions;
    }
  } catch (error) {
    // Fall back to geocoding if the Search Box endpoint is unavailable.
  }

  return geocodeLocation(query, nearbyPlaces);
}

export async function retrieveLocation(mapboxId) {
  const apiKey = getMapTilerApiKey();
  if (!apiKey || !mapboxId) return null;

  const params = new URLSearchParams({
    key: apiKey,
    language: 'en',
  });

  try {
    const response = await fetch(`${SEARCHBOX_ENDPOINT}/retrieve/${encodeURIComponent(mapboxId)}?${params.toString()}`);
    if (!response.ok) return null;

    const data = await response.json();
    const feature = Array.isArray(data?.features) ? data.features[0] : null;

    if (!feature) return null;

    const [lng, lat] = feature.geometry?.coordinates || [];
    return {
      id: feature.properties?.mapbox_id || mapboxId,
      label: feature.properties?.name || feature.properties?.full_address || feature.properties?.place_formatted || '',
      lat: lat ?? null,
      lng: lng ?? null,
    };
  } catch (error) {
    return null;
  }
}
