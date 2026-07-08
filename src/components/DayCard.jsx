import ElevationProfile from './ElevationProfile.jsx';

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
            <div className="stop" key={st.id}>
              <span className="dot"></span>
              <input className="ghost-input sname" placeholder="Waypoint name" value={st.name}
                onChange={e => onUpdateStopField(st.id, 'name', e.target.value)} />
              <input className="ghost-input snum" type="number" step="0.1" value={st.miles ?? 0}
                onChange={e => onUpdateStopField(st.id, 'miles', e.target.value)} />
              <input className="ghost-input snum" type="number" step="10" value={st.elev ?? 0}
                onChange={e => onUpdateStopField(st.id, 'elev', e.target.value)} />
              <span className="rm" onClick={() => onRemoveStop(st.id)}>×</span>
            </div>
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
