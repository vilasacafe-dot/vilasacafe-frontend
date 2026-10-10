import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

/**
 * Loads restaurant open/closed status + settings. Shared by Home,
 * Menu, Cart and Checkout so ordering can be gated consistently.
 */
export function useRestaurantStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .getStatus()
      .then((data) => mounted && setStatus(data))
      .catch((e) => mounted && setError(e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return {
    loading,
    error,
    restaurant: status?.restaurant || null,
    settings: status?.settings || null,
    isOpen: status?.settings?.is_open ?? false,
    closedMessage: status?.settings?.closed_message || 'We are currently closed.',
  };
}
