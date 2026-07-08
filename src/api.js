const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
  createTrip: () => request('/api/trips', { method: 'POST' }),
  getTrip: (code) => request(`/api/trips/${code}`),
  updateTrip: (code, data) => request(`/api/trips/${code}`, { method: 'PUT', body: JSON.stringify(data) }),

  addParticipant: (code, name) => request(`/api/trips/${code}/participants`, { method: 'POST', body: JSON.stringify({ name }) }),
  removeParticipant: (code, id) => request(`/api/trips/${code}/participants/${id}`, { method: 'DELETE' }),

  addDay: (code, data) => request(`/api/trips/${code}/days`, { method: 'POST', body: JSON.stringify(data) }),
  updateDay: (code, dayId, data) => request(`/api/trips/${code}/days/${dayId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeDay: (code, dayId) => request(`/api/trips/${code}/days/${dayId}`, { method: 'DELETE' }),

  addStop: (code, dayId, data) => request(`/api/trips/${code}/days/${dayId}/stops`, { method: 'POST', body: JSON.stringify(data) }),
  updateStop: (code, stopId, data) => request(`/api/trips/${code}/stops/${stopId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeStop: (code, stopId) => request(`/api/trips/${code}/stops/${stopId}`, { method: 'DELETE' }),
};
