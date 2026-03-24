import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { MunicipalityAggregateState } from '../services/control-room/municipality-aggregate.service';

interface MunicipalityMapViewProps {
  municipalities: MunicipalityAggregateState[];
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

function getStatusColor(status: 'ok' | 'warning' | 'critical') {
  switch (status) {
    case 'ok': return '#34d399';
    case 'warning': return '#fbbf24';
    case 'critical': return '#ef4444';
  }
}

function toGeoJSON(municipalities: MunicipalityAggregateState[]) {
  const belloCoords: [number, number] = [-75.5564, 6.3378];
  const barbosaCoords: [number, number] = [-75.3306, 6.4391];
  const copacabanaCoords: [number, number] = [-75.507, 6.347];

  const features = municipalities.map(mun => {
    const municipalityName = mun.municipality_name.toUpperCase();
    let coordinates: [number, number] | null = null;

    if (municipalityName.includes('BELLO') && !municipalityName.includes('BARBOSA')) {
      coordinates = belloCoords;
    } else if (municipalityName.includes('BARBOSA')) {
      coordinates = barbosaCoords;
    } else if (municipalityName.includes('COPACABANA')) {
      coordinates = copacabanaCoords;
    } else {
      console.warn(`Unknown municipality coordinates for: ${mun.municipality_name}`);
      return null;
    }

    return {
      type: 'Feature' as const,
      properties: {
        municipality_id: mun.municipality_id,
        municipality_name: mun.municipality_name,
        department_name: mun.department_name,
        total_tables: mun.total_tables,
        tables_covered: mun.tables_covered,
        checked_in_count: mun.checked_in_count,
        closed_count: mun.closed_count,
        incidents_count: mun.incidents_count,
        critical_incidents_count: mun.critical_incidents_count,
        evidences_count: mun.evidences_count,
        absent_witnesses_count: mun.absent_witnesses_count,
        status: mun.status
      },
      geometry: {
        type: 'Point' as const,
        coordinates
      }
    };
  }).filter(feature => feature !== null);

  return {
    type: 'FeatureCollection' as const,
    features
  };
}

export default function MunicipalityMapView({ municipalities }: MunicipalityMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalityAggregateState | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-75.4435, 6.3885],
      zoom: 11,
      pitch: 0,
      bearing: 0
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded || municipalities.length === 0) return;

    const geojson = toGeoJSON(municipalities);

    if (map.current.getSource('municipalities')) {
      const source = map.current.getSource('municipalities') as mapboxgl.GeoJSONSource;
      source.setData(geojson);
    } else {
      map.current.addSource('municipalities', {
        type: 'geojson',
        data: geojson
      });

      ['ok', 'warning', 'critical'].forEach(status => {
        const radiusExpression = status === 'critical'
          ? ['interpolate', ['linear'], ['zoom'], 5, 4, 7, 8, 9, 12, 11, 20, 13, 26]
          : status === 'warning'
          ? ['interpolate', ['linear'], ['zoom'], 5, 3, 7, 6, 9, 10, 11, 16, 13, 22]
          : ['interpolate', ['linear'], ['zoom'], 5, 2.5, 7, 5, 9, 9, 11, 14, 13, 20];

        map.current!.addLayer({
          id: `municipalities-${status}`,
          type: 'circle',
          source: 'municipalities',
          filter: ['==', ['get', 'status'], status],
          paint: {
            'circle-radius': radiusExpression as any,
            'circle-color': getStatusColor(status as 'ok' | 'warning' | 'critical'),
            'circle-opacity': 0.8,
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.3
          }
        });

        map.current!.on('click', `municipalities-${status}`, (e) => {
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            setSelectedMunicipality({
              municipality_id: props!.municipality_id,
              municipality_name: props!.municipality_name,
              department_name: props!.department_name,
              total_tables: props!.total_tables,
              tables_covered: props!.tables_covered,
              checked_in_count: props!.checked_in_count,
              closed_count: props!.closed_count,
              incidents_count: props!.incidents_count,
              critical_incidents_count: props!.critical_incidents_count,
              evidences_count: props!.evidences_count,
              absent_witnesses_count: props!.absent_witnesses_count,
              status: props!.status as 'ok' | 'warning' | 'critical'
            });
          }
        });

        map.current!.on('mouseenter', `municipalities-${status}`, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });

        map.current!.on('mouseleave', `municipalities-${status}`, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
        });
      });
    }

    if (municipalities.length > 0) {
      const geojsonData = toGeoJSON(municipalities);
      const bounds = new mapboxgl.LngLatBounds();
      geojsonData.features.forEach(feature => {
        bounds.extend(feature.geometry.coordinates as [number, number]);
      });
      map.current.fitBounds(bounds, { padding: 100, maxZoom: 11 });
    }
  }, [mapLoaded, municipalities]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />

      {selectedMunicipality && (
        <div className="absolute top-4 right-4 bg-gray-900/95 border border-gray-700 rounded-lg p-4 max-w-sm shadow-xl z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-200">{selectedMunicipality.municipality_name}</div>
              <div className="text-xs text-gray-500">{selectedMunicipality.department_name}</div>
            </div>
            <button onClick={() => setSelectedMunicipality(null)} className="text-gray-500 hover:text-gray-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Mesas cubiertas:</span>
              <span className="text-emerald-400 font-semibold">
                {selectedMunicipality.tables_covered} / {selectedMunicipality.total_tables}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Check-ins:</span>
              <span className="text-gray-300">{selectedMunicipality.checked_in_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mesas cerradas:</span>
              <span className="text-gray-300">{selectedMunicipality.closed_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Evidencias:</span>
              <span className="text-gray-300">{selectedMunicipality.evidences_count}</span>
            </div>
            {selectedMunicipality.absent_witnesses_count > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Testigos ausentes:</span>
                <span className="text-red-400 font-semibold">{selectedMunicipality.absent_witnesses_count}</span>
              </div>
            )}
            {selectedMunicipality.incidents_count > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Incidencias:</span>
                <span className="text-yellow-400 font-semibold">
                  {selectedMunicipality.incidents_count}
                  {selectedMunicipality.critical_incidents_count > 0 && (
                    <span className="text-red-400"> ({selectedMunicipality.critical_incidents_count} críticas)</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-gray-900/95 border border-gray-700 rounded-lg p-3 z-10">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Estado Municipal</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-emerald-400"></div>
            <span className="text-gray-400">Normal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
            <span className="text-gray-400">Con incidencias</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Crítico</span>
          </div>
        </div>
      </div>
    </div>
  );
}
