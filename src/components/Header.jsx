import { useState } from 'react';
import LocationSearchBox from './LocationSearchBox.jsx';

export default function Header({ trip, code, saveState, totalMiles, authUser, authError, onUpdateField, onJoin, onGoogleLogin, onGoogleLogout }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('trip', code);
    navigator.clipboard?.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }).catch(() => {
      prompt('Copy this link:', url.toString());
    });
  }

  function handleJoin() {
    const c = prompt('Enter trip code to join:');
    if (c && c.trim()) onJoin(c.trim().toUpperCase());
  }

  return (
    <header className="sign">
      <p className="eyebrow">Trailhead Permit</p>
      <input
        className="tripname ghost-input"
        value={trip.name}
        placeholder="Name this trip"
        onChange={e => onUpdateField('name', e.target.value)}
      />
      <LocationSearchBox
        value={trip.location || ''}
        placeholder="Where to? e.g. Enchantments, WA"
        onChange={(nextValue) => onUpdateField('location', nextValue)}
        className="ghost-input"
        style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '400px' }}
        inputStyle={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '400px', width: '100%' }}
        onSelect={(suggestion) => {
          onUpdateField('location', suggestion.label);
          onUpdateField('location_coords', suggestion.lat != null && suggestion.lng != null ? [suggestion.lat, suggestion.lng] : null);
        }}
      />
      <div className="trip-meta">
        <span>Start <b>
          <input className="ghost-input" type="date" style={{ width: '130px', color: 'var(--accent)' }}
            value={trip.start_date || ''} onChange={e => onUpdateField('start_date', e.target.value)} />
        </b></span>
        <span>End <b>
          <input className="ghost-input" type="date" style={{ width: '130px', color: 'var(--accent)' }}
            value={trip.end_date || ''} onChange={e => onUpdateField('end_date', e.target.value)} />
        </b></span>
        <span>Total <b>{totalMiles.toFixed(1)} mi</b></span>
      </div>

      <div className="sharebar">
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: 'var(--text-faint)' }}>TRIP CODE</span>
        <span className="code">{code}</span>
        <button className="btn small secondary" onClick={copyLink}>{copied ? 'Copied!' : 'Copy share link'}</button>
        <button className="btn small secondary" onClick={handleJoin}>Join a trip</button>
        {authUser ? (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Signed in as {authUser.email}</span>
            <button className="btn small secondary" onClick={onGoogleLogout}>Sign out</button>
          </>
        ) : (
          <button className="btn small secondary" onClick={onGoogleLogin}>Sign in with Google</button>
        )}
        <span className="savestate">{saveState}</span>
      </div>
      {authError ? <p style={{ color: '#ff8a80', margin: '6px 0 0', fontSize: '12px' }}>{authError}</p> : null}
    </header>
  );
}
