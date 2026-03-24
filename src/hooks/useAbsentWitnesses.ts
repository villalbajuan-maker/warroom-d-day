import { useState, useEffect } from 'react';
import { getAbsentWitnesses } from '../services/control-room/absent-witnesses.service';
import type { AbsentWitness } from '../types/control-room-services';

export function useAbsentWitnesses(campaignId: string | null, currentMinute: number | null) {
  const [data, setData] = useState<AbsentWitness[]>([]);
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
        const result = await getAbsentWitnesses(campaignId, currentMinute);
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
