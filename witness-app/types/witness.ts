export interface WitnessData {
  id: string;
  campaign_id: string;
  document_number: string;
  full_name: string;
  phone: string;
  whatsapp: string;
  email: string | null;
  date_of_birth: string | null;
  role: string;
}

export interface AssignmentData {
  id: string;
  campaign_id: string;
  witness_id: string;
  polling_table_id: string;
  polling_place_id: string;
  municipality_id: string;
  department_id: string;
  role: string;
}

export interface PollingTableData {
  id: string;
  table_number: number;
  polling_place_id: string;
}

export interface PollingPlaceData {
  id: string;
  name: string;
  address: string | null;
}

export interface MunicipalityData {
  id: string;
  name: string;
  municipality_code: string;
}

export interface DepartmentData {
  id: string;
  name: string;
  department_code: string;
}

export interface WitnessSession {
  witness: WitnessData;
  assignment: AssignmentData;
  polling_table: PollingTableData;
  polling_place: PollingPlaceData;
  municipality: MunicipalityData;
  department: DepartmentData;
  campaign_id: string;
  status: 'not_started' | 'present' | 'incident_reported' | 'closed';
}

export interface Witness {
  id: string;
  name: string;
  municipality: string;
  polling_station: string;
  table_number: string;
  status: 'not_started' | 'present' | 'incident_reported' | 'closed';
}

export interface IncidentType {
  id: string;
  label: string;
  value: string;
  severity: 'medium' | 'high' | 'critical';
  riskCode: string;
  requiresEvidence: boolean;
}

export interface IncidentCategory {
  id: string;
  label: string;
  value: string;
  incidents: IncidentType[];
}

export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  {
    id: 'operational',
    label: 'Problemas operativos',
    value: 'operational',
    incidents: [
      { id: 'op_1', label: 'Apertura tardía de la mesa', value: 'late_opening', severity: 'medium', riskCode: 'LATE_OPENING', requiresEvidence: true },
      { id: 'op_2', label: 'No llegaron jurados electorales', value: 'missing_jurors', severity: 'high', riskCode: 'MISSING_JURORS', requiresEvidence: true },
      { id: 'op_3', label: 'Material electoral incompleto', value: 'incomplete_material', severity: 'high', riskCode: 'INCOMPLETE_MATERIAL', requiresEvidence: true },
      { id: 'op_4', label: 'Mesa no abrió', value: 'table_not_opened', severity: 'critical', riskCode: 'TABLE_NOT_OPENED', requiresEvidence: true },
      { id: 'op_5', label: 'Testigo no pudo ingresar', value: 'witness_denied_access', severity: 'critical', riskCode: 'WITNESS_DENIED_ACCESS', requiresEvidence: true },
      { id: 'op_6', label: 'Incidencia no catalogada', value: 'operational_other', severity: 'medium', riskCode: 'OPERATIONAL_OTHER', requiresEvidence: true },
    ],
  },
  {
    id: 'restriction',
    label: 'Restricción al testigo',
    value: 'restriction',
    incidents: [
      { id: 'rest_1', label: 'No permiten observar el procedimiento', value: 'observation_denied', severity: 'critical', riskCode: 'OBSERVATION_DENIED', requiresEvidence: true },
      { id: 'rest_2', label: 'No permiten tomar fotografías', value: 'photo_denied', severity: 'critical', riskCode: 'PHOTO_DENIED', requiresEvidence: true },
      { id: 'rest_3', label: 'Testigo fue retirado', value: 'witness_removed', severity: 'critical', riskCode: 'WITNESS_REMOVED', requiresEvidence: true },
      { id: 'rest_4', label: 'Presión o intimidación', value: 'witness_intimidation', severity: 'critical', riskCode: 'WITNESS_INTIMIDATION', requiresEvidence: true },
      { id: 'rest_5', label: 'Restricción durante escrutinio', value: 'scrutiny_observation_denied', severity: 'critical', riskCode: 'SCRUTINY_DENIED', requiresEvidence: true },
      { id: 'rest_6', label: 'Incidencia no catalogada', value: 'restriction_other', severity: 'high', riskCode: 'RESTRICTION_OTHER', requiresEvidence: true },
    ],
  },
  {
    id: 'results',
    label: 'Irregularidades en resultados',
    value: 'results',
    incidents: [
      { id: 'res_1', label: 'Conteo iniciado antes de la hora oficial', value: 'early_counting', severity: 'critical', riskCode: 'EARLY_COUNTING', requiresEvidence: true },
      { id: 'res_2', label: 'Formulario E14 incompleto', value: 'e14_incomplete', severity: 'critical', riskCode: 'E14_INCOMPLETE', requiresEvidence: true },
      { id: 'res_3', label: 'Formulario E14 alterado', value: 'e14_altered', severity: 'critical', riskCode: 'E14_ALTERED', requiresEvidence: true },
      { id: 'res_4', label: 'No permiten verificar el conteo', value: 'count_verification_denied', severity: 'critical', riskCode: 'COUNT_VERIFICATION_DENIED', requiresEvidence: true },
      { id: 'res_5', label: 'Incidencia no catalogada', value: 'results_other', severity: 'high', riskCode: 'RESULTS_OTHER', requiresEvidence: true },
    ],
  },
];

export const INCIDENT_TYPES: IncidentType[] = [
  { id: '1', label: 'Testigo ausente', value: 'witness_absent', severity: 'critical', riskCode: 'WITNESS_ABSENT', requiresEvidence: false },
  { id: '2', label: 'Restricción de observación al testigo', value: 'observation_restriction', severity: 'critical', riskCode: 'OBSERVATION_RESTRICTION', requiresEvidence: false },
  { id: '3', label: 'Conteo iniciado antes de la hora oficial', value: 'early_counting', severity: 'critical', riskCode: 'EARLY_COUNTING_LEGACY', requiresEvidence: false },
  { id: '4', label: 'Formulario E14 incompleto o alterado', value: 'form_e14_issue', severity: 'critical', riskCode: 'FORM_E14_ISSUE', requiresEvidence: false },
  { id: '5', label: 'Interferencia procedimental', value: 'procedural_interference', severity: 'high', riskCode: 'PROCEDURAL_INTERFERENCE', requiresEvidence: false },
  { id: '6', label: 'Otra incidencia', value: 'other', severity: 'medium', riskCode: 'OTHER', requiresEvidence: false },
];

export interface PresenceRecord {
  witness_id: string;
  table_number: string;
  municipality: string;
  polling_station: string;
  timestamp: string;
}

export interface IncidentRecord {
  witness_id: string;
  table_number: string;
  municipality: string;
  polling_station: string;
  incident_type: string;
  description?: string;
  timestamp: string;
}

export interface EvidenceRecord {
  witness_id: string;
  table_number: string;
  municipality: string;
  polling_station: string;
  file_path: string;
  file_type: 'photo' | 'video';
  incident_id?: string;
  timestamp: string;
}
