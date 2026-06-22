import axios from 'axios';

// In development, '/api' is proxied to the backend by Vite (see vite.config.js).
// In production, set VITE_API_URL (e.g. https://your-api.up.railway.app/api) at build time.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
