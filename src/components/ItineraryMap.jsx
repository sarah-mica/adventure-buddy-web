import { useEffect, useMemo, useRef, useState } from 'react';
import * as maptilerSdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

const DEFAULT_CENTER = [39.5, -98.35];

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

export default function ItineraryMap({ days = [], tripLocation = '' }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    let alive = true;

    async function resolvePositions() {
      const entries = [];
      days.forEach((day, dayIndex) => {
        (day?.stops || []).forEach((stop, stopIndex) => {
          entries.push({
            id: stop?.id || `${dayIndex}-${stopIndex}`,
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
            position: [Number(entry.lat), Number(entry.lng)],
            label: entry.query,
          };
        }

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(entry.query)}`,
            { headers: { Accept: 'application/json' } }
          );
          const data = await response.json();
          const first = Array.isArray(data) ? data[0] : null;
          if (first?.lat && first?.lon) {
            return {
              id: entry.id,
              position: [Number(first.lat), Number(first.lon)],
              label: entry.query,
            };
          }
        } catch (error) {
          console.warn('Could not geocode itinerary stop', error);
        }

        return {
          id: entry.id,
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
  }, [days, tripLocation]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const apiKey = import.meta.env.VITE_MAPTILER_KEY;
    if (!apiKey) {
      mapContainer.current.innerHTML = '<div class="map-empty">Add a MapTiler API key to enable the interactive map.</div>';
      return;
    }

    if (mapRef.current) return;

    maptilerSdk.config.apiKey = apiKey;
    const map = new maptilerSdk.Map({
      container: mapContainer.current,
      style: maptilerSdk.MapStyle.OUTDOOR_V4,
      center: [DEFAULT_CENTER[1], DEFAULT_CENTER[0]],
      zoom: 3,
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const route = useMemo(() => positions.map((item) => item.position), [positions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderMapData = () => {
      if (!positions.length) return;

      if (map.getLayer('itinerary-route')) {
        map.removeLayer('itinerary-route');
      }
      if (map.getSource('itinerary-route')) {
        map.removeSource('itinerary-route');
      }

      const styleLayers = map.getStyle()?.layers || [];
      styleLayers.forEach((layer) => {
        if (layer.id.startsWith('marker-')) {
          if (map.getLayer(layer.id)) map.removeLayer(layer.id);
          if (map.getSource(layer.id)) map.removeSource(layer.id);
        }
      });

      if (route.length > 1) {
        const geojson = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: route.map((point) => [point[1], point[0]]),
              },
              properties: {},
            },
          ],
        };

        map.addSource('itinerary-route', { type: 'geojson', data: geojson });
        map.addLayer({
          id: 'itinerary-route',
          type: 'line',
          source: 'itinerary-route',
          paint: { 'line-color': '#d9822b', 'line-width': 3 },
        });
      }

      positions.forEach((item) => {
        const markerId = `marker-${item.id}`;
        const point = {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [item.position[1], item.position[0]] },
            properties: { title: item.label },
          }],
        };
        map.addSource(markerId, { type: 'geojson', data: point });
        map.addLayer({
          id: markerId,
          type: 'circle',
          source: markerId,
          paint: {
            'circle-radius': 8,
            'circle-color': '#d9822b',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 1,
          },
        });
      });

      const bounds = positions.reduce((acc, item) => {
        const [lat, lng] = item.position;
        const next = acc || [[lng, lat], [lng, lat]];
        return [
          [Math.min(next[0][0], lng), Math.min(next[0][1], lat)],
          [Math.max(next[1][0], lng), Math.max(next[1][1], lat)],
        ];
      }, null);

      if (bounds) {
        map.fitBounds(bounds, { padding: 48, maxZoom: 10 });
      }
    };

    if (map.isStyleLoaded && map.isStyleLoaded()) {
      renderMapData();
    } else {
      map.once('style.load', renderMapData);
    }
  }, [positions, route]);

  if (!days.some((day) => (day?.stops || []).length > 0)) {
    return <div className="map-empty">Add a few waypoints to see them plotted on a map.</div>;
  }

  return (
    <div className="map-card">
      <div className="map-shell" ref={mapContainer} />
    </div>
  );
}
