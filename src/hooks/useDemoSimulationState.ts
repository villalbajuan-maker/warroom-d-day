import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DemoSimulationState {
  campaignId: string;
  currentMinute: number;
  isRunning: boolean;
}

interface UseDemoSimulationStateReturn {
  state: DemoSimulationState | null;
  loading: boolean;
  error: string | null;
}

export function useDemoSimulationState(campaignId: string | null): UseDemoSimulationStateReturn {
  const [state, setState] = useState<DemoSimulationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchInitialState = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('demo_simulation_state')
          .select('demo_current_minute, is_running, campaign_id')
          .eq('campaign_id', campaignId)
          .maybeSingle();

        if (!mounted) return;

        if (fetchError) {
          setError('Error al cargar estado de simulación');
          setLoading(false);
          return;
        }

        if (data) {
          setState({
            campaignId: data.campaign_id,
            currentMinute: data.demo_current_minute ?? 0,
            isRunning: data.is_running
          });
          setError(null);
        }
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        setError('Error al cargar estado de simulación');
        setLoading(false);
      }
    };

    fetchInitialState();

    const channel = supabase
      .channel(`demo_simulation_${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'demo_simulation_state',
          filter: `campaign_id=eq.${campaignId}`
        },
        (payload) => {
          if (!mounted) return;

          const record = payload.new as {
            campaign_id: string;
            demo_current_minute: number;
            is_running: boolean;
          };

          setState({
            campaignId: record.campaign_id,
            currentMinute: record.demo_current_minute ?? 0,
            isRunning: record.is_running
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [campaignId]);

  return { state, loading, error };
}
