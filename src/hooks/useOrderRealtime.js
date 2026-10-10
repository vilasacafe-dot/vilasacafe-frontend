import { useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Subscribe to realtime UPDATEs for a single order. RLS ensures the
 * customer only receives their own order's changes. Cleans up on unmount.
 *
 * @param {string} orderId
 * @param {(row:object)=>void} onUpdate called with the updated order row
 */
export function useOrderRealtime(orderId, onUpdate) {
  useEffect(() => {
    if (!orderId) return undefined;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new) onUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, onUpdate]);
}
