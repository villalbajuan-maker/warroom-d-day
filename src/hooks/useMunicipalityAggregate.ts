import { useState, useEffect } from 'react';
import { getMunicipalityAggregateState, type MunicipalityAggregateState } from '../services/control-room/municipality-aggregate.service';

export function useMunicipalityAggregate(campaignId: string | null, currentMinute: number) {
  const [data, setData] = useState<MunicipalityAggregateState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!campaignId) return;

    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getMunicipalityAggregateState(campaignId, currentMinute);
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          console.error('Error fetching municipality aggregate:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [campaignId, currentMinute]);

  return { data, loading, error };
}
