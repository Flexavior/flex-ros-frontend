import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

/**
 * Laravel Echo + Reverb (Pusher protocol) for inbox realtime.
 * Returns null when VITE_REVERB_APP_KEY is unset (graceful degradation).
 */
export function createInboxEcho() {
  const key = import.meta.env.VITE_REVERB_APP_KEY;
  if (!key) {
    return null;
  }

  window.Pusher = Pusher;

  const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http';
  const token = localStorage.getItem('mss_token');

  return new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/broadcasting/auth',
    auth: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}
