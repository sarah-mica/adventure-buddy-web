import { useState, useEffect, useMemo, useRef } from 'react';
import { api } from './api.js';
import { createDebouncer } from './utils/debounce.js';
import TopoBackground from './components/TopoBackground.jsx';
import Header from './components/Header.jsx';
import Roster from './components/Roster.jsx';
import Itinerary from './components/Itinerary.jsx';

function normalizeTrip(data) {
  if (!data) return null;

  return {
    ...data,
    participants: Array.isArray(data.participants) ? data.participants : [],
    days: Array.isArray(data.days)
      ? data.days.map((day) => ({
          ...day,
          stops: Array.isArray(day?.stops) ? day.stops : [],
        }))
      : [],
  };
}

export default function App() {
  const [trip, setTrip] = useState(null);
  const [code, setCode] = useState(null);
  const [saveState, setSaveState] = useState('saved');
  const [loadError, setLoadError] = useState(null);
  const debounce = useMemo(() => createDebouncer(), []);
  const tripRef = useRef(trip);

  useEffect(() => { tripRef.current = trip; }, [trip]);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const c = params.get('trip');
      try {
        if (c) {
          const data = await api.getTrip(c);
          setTrip(normalizeTrip(data));
          setCode(c.toUpperCase());
        } else {
          const data = await api.createTrip();
          console.log('Created new trip', data);
          setTrip(normalizeTrip(data));
          setCode(data.code);
          const url = new URL(window.location.href);
          url.searchParams.set('trip', data.code);
          window.history.replaceState({}, '', url);
        }
      } catch (e) {
        setLoadError('Could not reach the trip server. Is the backend running?');
      }
    })();
  }, []);

  function markSaving() { setSaveState('saving…'); }
  function markSaved() { setSaveState('saved'); }
  function markFailed() { setSaveState('save failed'); }

  async function joinTrip(newCode) {
    try {
      const data = await api.getTrip(newCode);
      setTrip(normalizeTrip(data));
      setCode(newCode);
      const url = new URL(window.location.href);
      url.searchParams.set('trip', newCode);
      window.history.replaceState({}, '', url);
    } catch (e) {
      alert("Couldn't find a trip with that code.");
    }
  }

  function updateTripField(field, value) {
    setTrip(t => ({ ...t, [field]: value }));
    markSaving();
    debounce('trip-meta', async () => {
      const t = tripRef.current;
      try {
        await api.updateTrip(code, {
          name: t.name, location: t.location, start_date: t.start_date, end_date: t.end_date
        });
        markSaved();
      } catch (e) { markFailed(); }
    }, 500);
  }

  async function addParticipant(name) {
    markSaving();
    try {
      const p = await api.addParticipant(code, name);
      setTrip(t => normalizeTrip({ ...t, participants: [...(t?.participants ?? []), p] }));
      markSaved();
    } catch (e) { markFailed(); }
  }

  async function removeParticipant(id) {
    markSaving();
    try {
      await api.removeParticipant(code, id);
      setTrip(t => normalizeTrip({ ...t, participants: (t?.participants ?? []).filter(p => p.id !== id) }));
      markSaved();
    } catch (e) { markFailed(); }
  }

  function updateDayField(dayId, field, value) {
    setTrip(t => normalizeTrip({
      ...t,
      days: (t?.days ?? []).map(d => d.id === dayId ? { ...d, [field]: value } : d)
    }));
    markSaving();
    debounce(`day-${dayId}`, async () => {
      const day = tripRef.current.days.find(d => d.id === dayId);
      if (!day) return;
      try {
        await api.updateDay(code, dayId, { title: day.title, date: day.date, notes: day.notes });
        markSaved();
      } catch (e) { markFailed(); }
    }, 500);
  }

  async function addDay() {
    markSaving();
    try {
      const newDay = await api.addDay(code, { title: `Day ${(trip.days.length || 0) + 1}`, date: '' });
      setTrip(t => normalizeTrip({ ...t, days: [...(t?.days ?? []), newDay] }));
      markSaved();
    } catch (e) { markFailed(); }
  }

  async function removeDay(dayId) {
    if (!confirm('Remove this day?')) return;
    markSaving();
    try {
      await api.removeDay(code, dayId);
      setTrip(t => normalizeTrip({ ...t, days: (t?.days ?? []).filter(d => d.id !== dayId) }));
      markSaved();
    } catch (e) { markFailed(); }
  }

  function updateStopField(dayId, stopId, field, value) {
    setTrip(t => normalizeTrip({
      ...t,
      days: (t?.days ?? []).map(d => d.id !== dayId ? d : {
        ...d,
        stops: (d?.stops ?? []).map(s => s.id === stopId ? { ...s, [field]: value } : s)
      })
    }));
    markSaving();
    debounce(`stop-${stopId}`, async () => {
      const day = tripRef.current.days.find(d => d.id === dayId);
      const stop = day?.stops.find(s => s.id === stopId);
      if (!stop) return;
      try {
        await api.updateStop(code, stopId, { name: stop.name, miles: stop.miles, elev: stop.elev });
        markSaved();
      } catch (e) { markFailed(); }
    }, 500);
  }

  async function addStop(dayId) {
    markSaving();
    try {
      const newStop = await api.addStop(code, dayId, { name: '', miles: 0, elev: 0 });
      setTrip(t => normalizeTrip({
        ...t,
        days: (t?.days ?? []).map(d => d.id === dayId ? { ...d, stops: [...(d?.stops ?? []), newStop] } : d)
      }));
      markSaved();
    } catch (e) { markFailed(); }
  }

  async function removeStop(dayId, stopId) {
    markSaving();
    try {
      await api.removeStop(code, stopId);
      setTrip(t => normalizeTrip({
        ...t,
        days: (t?.days ?? []).map(d => d.id === dayId ? { ...d, stops: (d?.stops ?? []).filter(s => s.id !== stopId) } : d)
      }));
      markSaved();
    } catch (e) { markFailed(); }
  }

  if (loadError) {
    return (
      <div className="wrap">
        <p className="empty" style={{ marginTop: '80px' }}>{loadError}</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="wrap">
        <p className="empty" style={{ marginTop: '80px' }}>Loading trail data…</p>
      </div>
    );
  }

  const totalMiles = (trip.days ?? []).reduce(
    (sum, d) => sum + (d?.stops ?? []).reduce((s, st) => s + (parseFloat(st.miles) || 0), 0), 0
  );

  return (
    <>
      <TopoBackground />
      <div className="wrap">
        <Header
          trip={trip}
          code={code}
          saveState={saveState}
          totalMiles={totalMiles}
          onUpdateField={updateTripField}
          onJoin={joinTrip}
        />
        <Roster
          participants={trip.participants}
          onAdd={addParticipant}
          onRemove={removeParticipant}
        />
        <Itinerary
          days={trip.days}
          onUpdateDayField={updateDayField}
          onAddDay={addDay}
          onRemoveDay={removeDay}
          onUpdateStopField={updateStopField}
          onAddStop={addStop}
          onRemoveStop={removeStop}
        />
        <footer className="note">
          Trip code is your share link — anyone who enters it sees and edits this same itinerary.<br />
          Keep it between your crew.
        </footer>
      </div>
    </>
  );
}
