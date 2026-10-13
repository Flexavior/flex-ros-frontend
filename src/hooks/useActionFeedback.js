import { useCallback, useState } from 'react';

/**
 * Wrap async user actions with loading + success/error feedback for pop-ups.
 */
export function useActionFeedback() {
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  const runAction = useCallback(async (action, { successMessage = 'Success', errorMessage = 'Failed' } = {}) => {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await action();
      setFeedback({ type: 'success', message: successMessage });
      return result;
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response?.data?.errors && Object.values(err.response.data.errors).flat().join(' '))
        || err.message
        || errorMessage;
      setFeedback({ type: 'error', message: msg });
      throw err;
    } finally {
      setBusy(false);
    }
  }, []);

  return { feedback, busy, runAction, clearFeedback };
}
