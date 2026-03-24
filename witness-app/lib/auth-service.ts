import { supabase } from './supabase';
import {
  WitnessSession,
  WitnessData,
  AssignmentData,
  PollingTableData,
  PollingPlaceData,
  MunicipalityData,
  DepartmentData,
} from '@/types/witness';

export interface AuthResult {
  success: boolean;
  session?: WitnessSession;
  error?: string;
}

export async function authenticateByDocument(
  documentNumber: string
): Promise<AuthResult> {
  try {
    console.log('[AUTH] Searching witness with document:', documentNumber);

    const { data: witnessData, error: witnessError } = await supabase
      .from('witnesses')
      .select('*')
      .eq('document_number', documentNumber)
      .maybeSingle();

    console.log('[AUTH] Witness query result:', { data: witnessData, error: witnessError });

    if (witnessError) {
      console.error('[AUTH] Error fetching witness:', witnessError);
      return {
        success: false,
        error: 'Error al buscar testigo. Intenta nuevamente.',
      };
    }

    if (!witnessData) {
      console.log('[AUTH] No witness found for document:', documentNumber);
      return {
        success: false,
        error: 'Documento no encontrado en esta campaña',
      };
    }

    console.log('[AUTH] Witness found:', witnessData.full_name);

    console.log('[AUTH] Searching assignment for witness:', witnessData.id);

    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('witness_id', witnessData.id)
      .eq('campaign_id', witnessData.campaign_id)
      .maybeSingle();

    console.log('[AUTH] Assignment query result:', { data: assignmentData, error: assignmentError });

    if (assignmentError) {
      console.error('[AUTH] Error fetching assignment:', assignmentError);
      return {
        success: false,
        error: 'Error al validar asignación. Intenta nuevamente.',
      };
    }

    if (!assignmentData) {
      console.log('[AUTH] No assignment found for witness');
      return {
        success: false,
        error: 'Este testigo no tiene una mesa asignada',
      };
    }

    console.log('[AUTH] Assignment found, loading territorial data...');

    const { data: pollingTableData, error: pollingTableError } = await supabase
      .from('territorial_polling_tables')
      .select('*')
      .eq('id', assignmentData.polling_table_id)
      .single();

    if (pollingTableError || !pollingTableData) {
      console.error('Error fetching polling table:', pollingTableError);
      return {
        success: false,
        error: 'Error al cargar información de la mesa.',
      };
    }

    const { data: pollingPlaceData, error: pollingPlaceError } = await supabase
      .from('territorial_polling_places')
      .select('*')
      .eq('id', assignmentData.polling_place_id)
      .single();

    if (pollingPlaceError || !pollingPlaceData) {
      console.error('Error fetching polling place:', pollingPlaceError);
      return {
        success: false,
        error: 'Error al cargar información del puesto de votación.',
      };
    }

    const { data: municipalityData, error: municipalityError } = await supabase
      .from('territorial_municipalities')
      .select('*')
      .eq('id', assignmentData.municipality_id)
      .single();

    if (municipalityError || !municipalityData) {
      console.error('Error fetching municipality:', municipalityError);
      return {
        success: false,
        error: 'Error al cargar información del municipio.',
      };
    }

    const { data: departmentData, error: departmentError } = await supabase
      .from('territorial_departments')
      .select('*')
      .eq('id', assignmentData.department_id)
      .single();

    if (departmentError || !departmentData) {
      console.error('Error fetching department:', departmentError);
      return {
        success: false,
        error: 'Error al cargar información del departamento.',
      };
    }

    const session: WitnessSession = {
      witness: witnessData as WitnessData,
      assignment: assignmentData as AssignmentData,
      polling_table: pollingTableData as PollingTableData,
      polling_place: pollingPlaceData as PollingPlaceData,
      municipality: municipalityData as MunicipalityData,
      department: departmentData as DepartmentData,
      campaign_id: witnessData.campaign_id,
      status: 'not_started',
    };

    console.log('[AUTH] Session created successfully for:', witnessData.full_name);

    return {
      success: true,
      session,
    };
  } catch (error) {
    console.error('[AUTH] Unexpected error during authentication:', error);
    return {
      success: false,
      error: 'Error inesperado. Verifica tu conexión.',
    };
  }
}

export function saveSession(session: WitnessSession): void {
  try {
    localStorage.setItem('witness_session', JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

export function loadSession(): WitnessSession | null {
  try {
    const sessionData = localStorage.getItem('witness_session');
    if (!sessionData) return null;

    return JSON.parse(sessionData) as WitnessSession;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem('witness_session');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}
