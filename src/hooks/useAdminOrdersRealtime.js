import { useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Admin realtime: listen for new orders (INSERT) and status changes
 * (UPDATE) across all orders. RLS grants admins visibility to all rows.
 * Handlers should be stable (useCallback) to avoid re-subscribing.
 */
export function useAdminOrdersRealtime({ onInsert, onUpdate }) {
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => payload.new && onInsert?.(payload.new)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => payload.new && onUpdate?.(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onInsert, onUpdate]);
}
