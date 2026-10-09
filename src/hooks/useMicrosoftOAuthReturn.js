import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Handles ?microsoft=connected|error after mail OAuth return on any page. */
export function useMicrosoftOAuthReturn(setMessage, setError) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const ms = searchParams.get('microsoft');
    if (ms === 'connected') {
      setMessage?.('Microsoft 365 connected successfully.');
      searchParams.delete('microsoft');
      setSearchParams(searchParams, { replace: true });
    } else if (ms === 'error') {
      setError?.(searchParams.get('msg') || 'Microsoft connection failed.');
      searchParams.delete('microsoft');
      searchParams.delete('msg');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, setMessage, setError]);
}
