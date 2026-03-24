import { useState, useEffect } from 'react';
import { regenerateSnapshot, type FinalReportSnapshot } from '../services/final-report-snapshot.service';

export type FinalReportData = Omit<FinalReportSnapshot, 'id' | 'campaign_id' | 'generated_at' | 'created_at'>;

export function useFinalReport(campaignId: string | null, enabled: boolean = false) {
  const [data, setData] = useState<FinalReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!campaignId || !enabled) return;

    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);

        const snapshot = await regenerateSnapshot(campaignId);

        if (isMounted && snapshot) {
          const { id, campaign_id, generated_at, created_at, ...reportData } = snapshot;
          setData(reportData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          console.error('Error fetching final report:', err);
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
  }, [campaignId, enabled]);

  return { data, loading, error };
}
