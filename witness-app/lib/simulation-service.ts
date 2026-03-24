import { supabase } from './supabase';

export interface SimulationState {
  demo_start_at: string;
  demo_current_at: string;
  demo_end_at: string;
  is_running: boolean;
  demo_current_minute: number;
}

export interface JourneyPhase {
  phase: 'before_opening' | 'voting' | 'closing' | 'finished';
  label: string;
}

export async function getSimulationState(campaignId: string): Promise<SimulationState | null> {
  try {
    const { data, error } = await supabase
      .from('demo_simulation_state')
      .select('*')
      .eq('campaign_id', campaignId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching simulation state:', error);
      return null;
    }

    return data as SimulationState | null;
  } catch (error) {
    console.error('Unexpected error fetching simulation state:', error);
    return null;
  }
}

export function getCurrentPhase(simulationState: SimulationState | null): JourneyPhase {
  if (!simulationState) {
    return {
      phase: 'before_opening',
      label: 'Antes de apertura',
    };
  }

  const startTime = new Date(simulationState.demo_start_at).getTime();
  const currentTime = new Date(simulationState.demo_current_at).getTime();
  const endTime = new Date(simulationState.demo_end_at).getTime();

  if (currentTime < startTime) {
    return {
      phase: 'before_opening',
      label: 'Antes de apertura',
    };
  }

  const votingEndTime = startTime + (8 * 60 * 60 * 1000);

  if (currentTime >= startTime && currentTime < votingEndTime) {
    return {
      phase: 'voting',
      label: 'Jornada activa',
    };
  }

  if (currentTime >= votingEndTime && currentTime < endTime) {
    return {
      phase: 'closing',
      label: 'Cierre / Escrutinio',
    };
  }

  return {
    phase: 'finished',
    label: 'Jornada finalizada',
  };
}

export function formatSimulatedTime(simulationState: SimulationState | null): string {
  if (!simulationState) {
    return '--:--';
  }

  const date = new Date(simulationState.demo_current_at);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}
