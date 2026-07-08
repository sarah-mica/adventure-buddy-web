import { useState } from 'react';

export default function Header({ trip, code, saveState, totalMiles, onUpdateField, onJoin }) {
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
      <input
        className="ghost-input"
        style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '400px' }}
        placeholder="Where to? e.g. Enchantments, WA"
        value={trip.location || ''}
        onChange={e => onUpdateField('location', e.target.value)}
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
        <span className="savestate">{saveState}</span>
      </div>
    </header>
  );
}
