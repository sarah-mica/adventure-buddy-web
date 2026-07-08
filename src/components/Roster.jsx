import { useState } from 'react';

export default function Roster({ participants, onAdd, onRemove }) {
  const [name, setName] = useState('');

  function submit() {
    const n = name.trim();
    if (n) { onAdd(n); setName(''); }
  }

  return (
    <section className="participants">
      <p className="sectitle">Who's coming</p>
      <div className="roster">
        {participants.length === 0 && (
          <span className="empty" style={{ padding: '4px 0' }}>No one added yet</span>
        )}
        {participants.map(p => (
          <div className="chip" key={p.id}>
            <span>{p.name}</span>
            <span className="x" onClick={() => onRemove(p.id)}>×</span>
          </div>
        ))}
      </div>
      <div className="addchip" style={{ marginTop: '10px' }}>
        <input
          value={name}
          maxLength={24}
          placeholder="Add a name…"
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        />
        <button className="btn small" onClick={submit}>Add</button>
      </div>
    </section>
  );
}
