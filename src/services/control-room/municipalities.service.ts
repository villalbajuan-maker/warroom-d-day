import { supabase } from '../../lib/supabase';
import type { MunicipalityWithCoverage } from '../../types/control-room-services';

export async function getMunicipalitiesAndPollingPlaces(
  campaignId: string
): Promise<MunicipalityWithCoverage[]> {
  const { data: coverageData, error } = await supabase
    .from('assignments')
    .select(`
      municipality_id,
      polling_place_id,
      polling_table_id,
      territorial_municipalities!inner (
        id,
        name,
        department_code
      ),
      territorial_polling_places!inner (
        id,
        name
      )
    `)
    .eq('campaign_id', campaignId);

  if (error) throw error;

  const { data: departmentData, error: deptError } = await supabase
    .from('territorial_departments')
    .select('department_code, name');

  if (deptError) throw deptError;

  const deptMap = new Map(
    departmentData?.map(d => [d.department_code, d.name]) || []
  );

  const { data: allTablesData, error: tablesError } = await supabase
    .from('territorial_polling_tables')
    .select(`
      id,
      polling_place_id,
      territorial_polling_places!inner (
        id,
        name,
        municipality_code,
        territorial_version_id
      )
    `)
    .in(
      'polling_place_id',
      coverageData?.map(c => c.polling_place_id) || []
    );

  if (tablesError) throw tablesError;

  const pollingPlaceToTotalTables = new Map<string, number>();
  allTablesData?.forEach(table => {
    const placeId = table.polling_place_id;
    pollingPlaceToTotalTables.set(
      placeId,
      (pollingPlaceToTotalTables.get(placeId) || 0) + 1
    );
  });

  const municipalityMap = new Map<string, {
    municipality_id: string;
    municipality_name: string;
    department_code: string;
    polling_places: Map<string, {
      polling_place_id: string;
      polling_place_name: string;
      tables_covered: number;
    }>;
  }>();

  coverageData?.forEach(assignment => {
    const munId = assignment.municipality_id;
    const munData = assignment.territorial_municipalities;
    const placeData = assignment.territorial_polling_places;

    if (!municipalityMap.has(munId)) {
      municipalityMap.set(munId, {
        municipality_id: munId,
        municipality_name: munData.name,
        department_code: munData.department_code,
        polling_places: new Map()
      });
    }

    const mun = municipalityMap.get(munId)!;
    const placeId = placeData.id;

    if (!mun.polling_places.has(placeId)) {
      mun.polling_places.set(placeId, {
        polling_place_id: placeId,
        polling_place_name: placeData.name,
        tables_covered: 0
      });
    }

    mun.polling_places.get(placeId)!.tables_covered += 1;
  });

  const result: MunicipalityWithCoverage[] = Array.from(municipalityMap.values()).map(mun => ({
    department_name: deptMap.get(mun.department_code) || mun.department_code,
    municipality_id: mun.municipality_id,
    municipality_name: mun.municipality_name,
    polling_places: Array.from(mun.polling_places.values()).map(place => ({
      polling_place_id: place.polling_place_id,
      polling_place_name: place.polling_place_name,
      total_tables: pollingPlaceToTotalTables.get(place.polling_place_id) || 0,
      tables_covered: place.tables_covered
    }))
  }));

  return result.sort((a, b) => a.municipality_name.localeCompare(b.municipality_name));
}
