import { useState, useEffect } from 'react';
import { getPollingTablesState } from '../services/control-room/tables.service';
import type { PollingTableState } from '../types/control-room-services';

export function usePollingTablesState(campaignId: string | null, currentMinute: number | null) {
  const [data, setData] = useState<PollingTableState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!campaignId || currentMinute === null) {
      setData([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getPollingTablesState(campaignId, currentMinute);
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [campaignId, currentMinute]);

  return { data, loading, error };
}
