/** API host for SPA — build-time env, then known Render split-host, else Vite proxy path. */
export function resolveApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim().replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'mss-crm-fe.onrender.com') {
      return 'https://mss-crm.onrender.com/api/v1';
    }
  }

  return '/api/v1';
}
