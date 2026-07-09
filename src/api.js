const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  createTrip: () => request('/api/trip', { method: 'POST' }),
  getTrip: (code) => request(`/api/trip/${code}`),
  updateTrip: (code, data) => request(`/api/trip/${code}`, { method: 'PUT', body: JSON.stringify(data) }),

  addParticipant: (code, name) => request(`/api/trip/${code}/participants`, { method: 'POST', body: JSON.stringify({ name }) }),
  removeParticipant: (code, id) => request(`/api/trip/${code}/participants/${id}`, { method: 'DELETE' }),

  addDay: (code, data) => request(`/api/trips/${code}/days`, { method: 'POST', body: JSON.stringify(data) }),
  updateDay: (code, dayId, data) => request(`/api/trip/${code}/days/${dayId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeDay: (code, dayId) => request(`/api/trip/${code}/days/${dayId}`, { method: 'DELETE' }),

  addStop: (code, dayId, data) => request(`/api/trip/${code}/days/${dayId}/stops`, { method: 'POST', body: JSON.stringify(data) }),
  updateStop: (code, stopId, data) => request(`/api/trip/${code}/stops/${stopId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeStop: (code, stopId) => request(`/api/trip/${code}/stops/${stopId}`, { method: 'DELETE' }),
};
