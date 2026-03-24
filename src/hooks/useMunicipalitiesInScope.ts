import { useState, useEffect } from 'react';
import { getMunicipalitiesAndPollingPlaces } from '../services/control-room/municipalities.service';
import type { MunicipalityWithCoverage } from '../types/control-room-services';

export function useMunicipalitiesInScope(campaignId: string | null) {
  const [data, setData] = useState<MunicipalityWithCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setData([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getMunicipalitiesAndPollingPlaces(campaignId);
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
  }, [campaignId]);

  return { data, loading, error };
}
