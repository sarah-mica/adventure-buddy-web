import { useEffect, useState } from 'react';
import ElevationProfile from './ElevationProfile.jsx';

function StopRow({ stop, onUpdateStopField, onRemoveStop, nearbyStops = [] }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);

  useEffect(() => {
    const query = (stop?.name || '').trim();
    if (suppressSuggestions || query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      const apiKey = import.meta.env.VITE_MAPTILER_KEY;
      if (!apiKey) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const nearbyParams = nearbyStops
          .filter((item) => item.lat != null && item.lng != null)
          .slice(0, 3)
          .map((item) => `lat=${item.lat}&lon=${item.lng}`)
          .join('&');
        const res = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?fuzzy=true&limit=8&key=${apiKey}${nearbyParams ? `&${nearbyParams}` : ''}`
        );
        const data = await res.json();
        const items = Array.isArray(data?.features)
          ? data.features.map((feature) => ({
              id: feature.id,
              label: feature.place_name || feature.text || feature.properties?.name || '',
              lat: feature.geometry?.coordinates?.[1] ?? null,
              lng: feature.geometry?.coordinates?.[0] ?? null,
            })).filter((item) => item.label)
          : [];
        setSuggestions(items);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [nearbyStops, stop?.name]);

  function handleSelect(suggestion) {
    onUpdateStopField(stop.id, 'name', suggestion.label);
    onUpdateStopField(stop.id, 'lat', suggestion.lat);
    onUpdateStopField(stop.id, 'lng', suggestion.lng);
    setSuggestions([]);
    setIsSearching(false);
    setSuppressSuggestions(true);
  }

  return (
    <div className="stop" key={stop.id}>
      <span className="dot"></span>
      <div className="stop-name-wrap">
        <input
          className="ghost-input sname"
          placeholder="Waypoint name"
          value={stop.name}
          onChange={(e) => {
            onUpdateStopField(stop.id, 'name', e.target.value);
            if (suppressSuggestions) {
              setSuppressSuggestions(false);
            }
          }}
        />
        {isSearching && <div className="stop-searching">Searching places…</div>}
        {suggestions.length > 0 && (
          <div className="stop-suggestions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                className="stop-suggestion"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(suggestion);
                }}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <input className="ghost-input snum" type="number" step="0.1" value={stop.miles ?? 0}
        onChange={(e) => onUpdateStopField(stop.id, 'miles', e.target.value)} />
      <input className="ghost-input snum" type="number" step="10" value={stop.elev ?? 0}
        onChange={(e) => onUpdateStopField(stop.id, 'elev', e.target.value)} />
      <span className="rm" onClick={() => onRemoveStop(stop.id)}>×</span>
    </div>
  );
}

export default function DayCard({ day, index, onUpdateField, onRemove, onUpdateStopField, onAddStop, onRemoveStop }) {
  const miles = day.stops.reduce((s, st) => s + (parseFloat(st.miles) || 0), 0);
  const elevGain = day.stops.reduce((s, st) => s + (parseFloat(st.elev) > 0 ? parseFloat(st.elev) : 0), 0);

  return (
    <div className="day">
      <div className="blaze">{index + 1}</div>
      <div className="daycard">
        <div className="daycard-head">
          <input className="ghost-input dtitle" value={day.title}
            onChange={e => onUpdateField('title', e.target.value)} />
          <input className="ghost-input ddate" type="date" value={day.date || ''}
            onChange={e => onUpdateField('date', e.target.value)} />
        </div>
        <div className="day-stats">
          <span>Distance <b>{miles.toFixed(1)} mi</b></span>
          <span>Elev gain <b>{Math.round(elevGain)} ft</b></span>
          <span>Stops <b>{day.stops.length}</b></span>
        </div>
        <ElevationProfile stops={day.stops} />
        <div className="stop-labels">
          <span></span><span>Waypoint</span><span>Miles</span><span>Elev ft</span><span></span>
        </div>
        <div className="stops">
          {day.stops.map(st => (
            <StopRow
              key={st.id}
              stop={st}
              nearbyStops={day.stops.filter((candidate) => candidate.id !== st.id && candidate.lat != null && candidate.lng != null)}
              onUpdateStopField={onUpdateStopField}
              onRemoveStop={onRemoveStop}
            />
          ))}
        </div>
        <div className="addstop" onClick={onAddStop}>+ add waypoint</div>
        <textarea className="daynotes" placeholder="Notes — water sources, permits, campsite, weather…"
          value={day.notes || ''} onChange={e => onUpdateField('notes', e.target.value)} />
        <div className="day-foot">
          <button className="btn danger small" onClick={onRemove}>Remove day</button>
        </div>
      </div>
    </div>
  );
}
