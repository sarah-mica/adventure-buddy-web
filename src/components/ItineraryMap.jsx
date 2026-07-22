import { useEffect, useMemo, useRef, useState } from 'react';
import * as maptilerSdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { geocodeLocation } from '../utils/maptilerApis.js';

const DEFAULT_CENTER = [39.5, -98.35];
const DEFAULT_ZOOM = 3;

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createFallbackPosition(query, index) {
  const hash = hashString(query || `stop-${index}`);
  const lat = 39.0 + ((hash % 17) - 8) / 100;
  const lng = -120.0 + (((hash >> 3) % 17) - 8) / 100;
  return [lat, lng];
}

function buildQuery(stop, day, tripLocation) {
  return [stop?.name, day?.title, tripLocation].filter(Boolean).join(' ').trim();
}

function getDayColors(dayCount) {
  const palette = ['#d9822b', '#7c9473', '#5b8db8', '#c1553a', '#8f7d4f', '#9c6ade', '#3fa7a3'];
  return Array.from({ length: dayCount }, (_, index) => palette[index % palette.length]);
}

function normalizePoint(point) {
  if (!Array.isArray(point) || point.length < 2) return null;
  const lat = Number(point[0]);
  const lng = Number(point[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

export default function ItineraryMap({ days = [], tripLocation = '', tripLocationCoords = null }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [positions, setPositions] = useState([]);
  const [tripLocationPosition, setTripLocationPosition] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const dayColors = useMemo(() => getDayColors(days.length || 1), [days.length]);

  const itinerarySignature = useMemo(() => JSON.stringify((days || []).map((day, dayIndex) => ({
    dayTitle: day?.title || '',
    stops: (day?.stops || []).map((stop, stopIndex) => ({
      id: stop?.id || `${dayIndex}-${stopIndex}`,
      name: stop?.name || '',
      lat: stop?.lat ?? null,
      lng: stop?.lng ?? null,
    })),
  }))), [days, tripLocation]);

  useEffect(() => {
    let alive = true;

    async function resolvePositions() {
      if (Array.isArray(tripLocationCoords) && tripLocationCoords.length >= 2) {
        const [lat, lng] = tripLocationCoords;
        if (alive) setTripLocationPosition(normalizePoint([lat, lng]));
      } else if (tripLocation?.trim()) {
        try {
          const results = await geocodeLocation(tripLocation, []);
          const first = Array.isArray(results) ? results[0] : null;
          if (first?.lat != null && first?.lng != null) {
            if (alive) setTripLocationPosition([Number(first.lat), Number(first.lng)]);
          } else if (alive) {
            setTripLocationPosition(null);
          }
        } catch (error) {
          if (alive) setTripLocationPosition(null);
        }
      } else if (alive) {
        setTripLocationPosition(null);
      }

      const entries = [];
      days.forEach((day, dayIndex) => {
        (day?.stops || []).forEach((stop, stopIndex) => {
          entries.push({
            id: stop?.id || `${dayIndex}-${stopIndex}`,
            dayIndex,
            query: buildQuery(stop, day, tripLocation),
            index: dayIndex + stopIndex,
            lat: stop?.lat ?? null,
            lng: stop?.lng ?? null,
          });
        });
      });

      if (entries.length === 0) {
        if (alive) setPositions([]);
        return;
      }

      const resolved = await Promise.all(entries.map(async (entry) => {
        if (entry.lat != null && entry.lng != null) {
          return {
            id: entry.id,
            dayIndex: entry.dayIndex,
            position: [Number(entry.lat), Number(entry.lng)],
            label: entry.query,
          };
        }

        try {
          const results = await geocodeLocation(entry.query, []);
          const first = Array.isArray(results) ? results[0] : null;
          if (first?.lat != null && first?.lng != null) {
            return {
              id: entry.id,
              position: [Number(first.lat), Number(first.lng)],
              label: first.label || entry.query,
            };
          }
        } catch (error) {
          console.warn('Could not geocode itinerary stop', error);
        }

        return {
          id: entry.id,
          dayIndex: entry.dayIndex,
          position: createFallbackPosition(entry.query, entry.index),
          label: entry.query,
        };
      }));

      if (alive) setPositions(resolved);
    }

    resolvePositions();
    return () => {
      alive = false;
    };
  }, [itinerarySignature, tripLocation, tripLocationCoords]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (mapRef.current) return;

    const apiKey = import.meta.env.VITE_MAPTILER_KEY;
    if (!apiKey) {
      mapContainer.current.innerHTML = '<div class="map-empty">Add a MapTiler API key to enable the interactive map.</div>';
      return;
    }

    maptilerSdk.config.apiKey = apiKey;
    const map = new maptilerSdk.Map({
      container: mapContainer.current,
      style: maptilerSdk.MapStyle.OUTDOOR_V4,
      center: [DEFAULT_CENTER[1], DEFAULT_CENTER[0]],
      zoom: DEFAULT_ZOOM,
    });

    map.on('load', () => {
      requestAnimationFrame(() => map.resize());
      setMapReady(true);
    });

    map.on('error', (event) => {
      console.error('MapTiler error', event?.error || event);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const points = [];
    if (tripLocationPosition) points.push(tripLocationPosition);
    positions.forEach((item) => points.push(item.position));

    if (!points.length) return;

    const allPoints = points.filter(Boolean);
    const tripMarkerId = 'marker-trip-location';

    if (tripLocationPosition) {
      const markerGeojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [tripLocationPosition[1], tripLocationPosition[0]] },
            properties: { title: tripLocation || 'Trip location' },
          },
        ],
      };

      if (!map.getSource(tripMarkerId)) {
        map.addSource(tripMarkerId, { type: 'geojson', data: markerGeojson });
        map.addLayer({
          id: tripMarkerId,
          type: 'circle',
          source: tripMarkerId,
          paint: {
            'circle-radius': 10,
            'circle-color': '#1f6feb',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          },
        });
      } else {
        map.getSource(tripMarkerId).setData(markerGeojson);
      }
    } else if (map.getLayer(tripMarkerId)) {
      map.removeLayer(tripMarkerId);
      map.removeSource(tripMarkerId);
    }

    if (allPoints.length === 1) {
      const [lat, lng] = allPoints[0];
      map.flyTo({ center: [lng, lat], zoom: 8 });
      return;
    }

    const bounds = allPoints.reduce((acc, point) => {
      const [lat, lng] = point;
      const next = acc || [[lng, lat], [lng, lat]];
      return [
        [Math.min(next[0][0], lng), Math.min(next[0][1], lat)],
        [Math.max(next[1][0], lng), Math.max(next[1][1], lat)],
      ];
    }, null);

    if (bounds) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 10 });
    }
  }, [mapReady, positions, tripLocationPosition]);

  const hasTripLocation = Boolean(tripLocation?.trim());
  const hasWaypoints = days.some((day) => (day?.stops || []).length > 0);

  if (!hasTripLocation && !hasWaypoints) {
    return <div className="map-empty">Add a trip location or a few waypoints to see them plotted on a map.</div>;
  }

  return (
    <div className="map-card">
      <div className="map-shell" ref={mapContainer} />
    </div>
  );
}
