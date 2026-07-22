import { useEffect, useState } from 'react';
import { geocodeLocation } from '../utils/maptilerApis';

export default function LocationSearchBox({
  value,
  placeholder = 'Where to? e.g. Enchantments, WA',
  onChange,
  nearbyPlaces = [],
  className = 'ghost-input',
  style = {},
  inputStyle = {},
  onSelect,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);

  useEffect(() => {
    const query = (value || '').trim();
    if (suppressSuggestions || query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const items = await geocodeLocation(query, nearbyPlaces);
        setSuggestions(items);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [nearbyPlaces, suppressSuggestions, value]);

  function handleSelect(suggestion) {
    setSuggestions([]);
    setIsSearching(false);
    setSuppressSuggestions(true);
    if (onSelect) {
      onSelect(suggestion);
    } else if (onChange) {
      onChange(suggestion.label);
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        className={className}
        style={inputStyle}
        placeholder={placeholder}
        value={value || ''}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (onChange) onChange(nextValue);
          if (suppressSuggestions) {
            setSuppressSuggestions(false);
          }
        }}
      />
      {isSearching && <div className="stop-searching">Searching places…</div>}
      {suggestions.length > 0 && (
        <div className="stop-suggestions" style={{ position: 'absolute', zIndex: 20, top: 'calc(100% + 4px)', left: 0, right: 0 }}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className="stop-suggestion"
              onMouseDown={(event) => {
                event.preventDefault();
                handleSelect(suggestion);
              }}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
