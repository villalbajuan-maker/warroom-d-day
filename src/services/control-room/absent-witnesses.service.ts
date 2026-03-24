import { supabase } from '../../lib/supabase';
import type { AbsentWitness } from '../../types/control-room-services';

export async function getAbsentWitnesses(
  campaignId: string,
  currentMinute: number
): Promise<AbsentWitness[]> {
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      id,
      witness_id,
      polling_table_id,
      witnesses!inner (
        id,
        full_name
      ),
      territorial_polling_places!inner (
        id,
        name
      ),
      territorial_polling_tables!inner (
        id,
        table_number
      )
    `)
    .eq('campaign_id', campaignId);

  if (assignmentsError) throw assignmentsError;

  const { data: checkInEvents, error: checkInError } = await supabase
    .from('demo_timeline_events')
    .select('witness_id, event_type, scheduled_minute')
    .eq('campaign_id', campaignId)
    .in('event_type', ['CHECK_IN', 'NO_SHOW'])
    .lte('scheduled_minute', currentMinute);

  if (checkInError) throw checkInError;

  const witnessStatusMap = new Map<string, 'CHECKED_IN' | 'NO_SHOW'>();

  checkInEvents?.forEach(event => {
    if (event.event_type === 'CHECK_IN') {
      witnessStatusMap.set(event.witness_id, 'CHECKED_IN');
    } else if (event.event_type === 'NO_SHOW') {
      witnessStatusMap.set(event.witness_id, 'NO_SHOW');
    }
  });

  const absentWitnesses: AbsentWitness[] = [];

  assignments?.forEach(assignment => {
    const witnessId = assignment.witness_id;
    const status = witnessStatusMap.get(witnessId);

    if (!status || status === 'NO_SHOW') {
      absentWitnesses.push({
        witness_id: witnessId,
        witness_name: assignment.witnesses.full_name,
        polling_place_name: assignment.territorial_polling_places.name,
        table_number: assignment.territorial_polling_tables.table_number,
        severity: 'critical'
      });
    }
  });

  return absentWitnesses.sort((a, b) => a.witness_name.localeCompare(b.witness_name));
}
