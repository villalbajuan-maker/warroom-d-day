export interface MunicipalityPollingPlace {
  polling_place_id: string;
  polling_place_name: string;
  total_tables: number;
  tables_covered: number;
}

export interface MunicipalityWithCoverage {
  department_name: string;
  municipality_id: string;
  municipality_name: string;
  polling_places: MunicipalityPollingPlace[];
}

export interface AbsentWitness {
  witness_id: string;
  witness_name: string;
  polling_place_name: string;
  table_number: number;
  severity: 'critical';
}

export type PollingPlaceStatus = 'ok' | 'warning' | 'critical';

export interface PollingPlaceAggregateState {
  polling_place_id: string;
  polling_place_name: string;
  municipality_name: string;
  total_tables: number;
  checked_in_tables: number;
  closed_tables: number;
  incidents_count: number;
  evidences_count: number;
  signals_count: number;
  status: PollingPlaceStatus;
}

export interface PollingTableState {
  polling_table_id: string;
  table_number: number;
  polling_place_name: string;
  municipality_name: string;
  witness_name: string | null;
  checked_in: boolean;
  closed: boolean;
  e14_received: boolean;
  incidents_count: number;
  evidences_count: number;
}
