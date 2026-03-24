export interface CampaignContext {
  campaignId: string;
  campaignName: string;
  clientName: string;
  coverageStatus: 'draft' | 'locked';
  dayDAt: string | null;
  demoCurrentAt: string | null;
}

export interface KPIData {
  totalMesas: number;
  mesasCubiertas: number;
  mesasSinCubrir: number;
  testigosActivos: number;
  incidenciasCount: number;
  evidenciasCount: number;
  mesasReportando: number;
}

export interface MapMarkerData {
  id: string;
  municipio: string;
  puesto: string;
  mesa: string;
  tableNumber: number;
  status: 'operando' | 'alerta' | 'critica' | 'sin-reporte';
  lat: number;
  lng: number;
  x: number;
  y: number;
}

export interface IncidentData {
  id: string;
  hora: string;
  tipo: string;
  mesa: string;
  puesto: string;
  municipio: string;
  severidad: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
}

export interface EvidenceData {
  id: string;
  mesa: string;
  puesto: string;
  municipio: string;
  hora: string;
  imageUrl: string;
  evidenceType: string;
}

export interface RegionAlert {
  municipio: string;
  incidenciasCount: number;
}
