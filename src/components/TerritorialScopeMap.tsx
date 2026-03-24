import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { MunicipalityWithCoverage } from '../types/control-room-services';

interface TerritorialScopeMapProps {
  municipalities: MunicipalityWithCoverage[];
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MUNICIPALITY_COORDINATES: Record<string, [number, number]> = {
  'BELLO': [-75.5564, 6.3378],
  'BARBOSA': [-75.3306, 6.4391],
  'COPACABANA': [-75.507, 6.347]
};

function getMunicipalityCoordinates(name: string): [number, number] | null {
  const upperName = name.toUpperCase();
  for (const key in MUNICIPALITY_COORDINATES) {
    if (upperName.includes(key)) {
      return MUNICIPALITY_COORDINATES[key];
    }
  }
  return null;
}

interface MunicipalityStats {
  municipality_name: string;
  department_name: string;
  polling_places_count: number;
  total_tables: number;
  tables_covered: number;
}

function calculateStats(municipality: MunicipalityWithCoverage): MunicipalityStats {
  const total_tables = municipality.polling_places.reduce(
    (sum, place) => sum + place.total_tables,
    0
  );
  const tables_covered = municipality.polling_places.reduce(
    (sum, place) => sum + place.tables_covered,
    0
  );

  return {
    municipality_name: municipality.municipality_name,
    department_name: municipality.department_name,
    polling_places_count: municipality.polling_places.length,
    total_tables,
    tables_covered
  };
}

function toGeoJSON(municipalities: MunicipalityWithCoverage[]) {
  const features = municipalities
    .map(mun => {
      const coordinates = getMunicipalityCoordinates(mun.municipality_name);
      if (!coordinates) return null;

      const stats = calculateStats(mun);

      return {
        type: 'Feature' as const,
        properties: {
          municipality_id: mun.municipality_id,
          municipality_name: stats.municipality_name,
          department_name: stats.department_name,
          polling_places_count: stats.polling_places_count,
          total_tables: stats.total_tables,
          tables_covered: stats.tables_covered
        },
        geometry: {
          type: 'Point' as const,
          coordinates
        }
      };
    })
    .filter(feature => feature !== null);

  return {
    type: 'FeatureCollection' as const,
    features
  };
}

export default function TerritorialScopeMap({ municipalities }: TerritorialScopeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalityStats | null>(null);

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

      map.current.addLayer({
        id: 'municipalities-layer',
        type: 'circle',
        source: 'municipalities',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 3,
            7, 6,
            9, 10,
            11, 16,
            13, 22
          ],
          'circle-color': '#60a5fa',
          'circle-opacity': 0.7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#3b82f6',
          'circle-stroke-opacity': 0.8
        }
      });

      map.current.on('click', 'municipalities-layer', (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          setSelectedMunicipality({
            municipality_name: props!.municipality_name,
            department_name: props!.department_name,
            polling_places_count: props!.polling_places_count,
            total_tables: props!.total_tables,
            tables_covered: props!.tables_covered
          });
        }
      });

      map.current.on('mouseenter', 'municipalities-layer', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'municipalities-layer', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
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
            <button
              onClick={() => setSelectedMunicipality(null)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Puestos de votación:</span>
              <span className="text-blue-400 font-semibold">{selectedMunicipality.polling_places_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mesas totales:</span>
              <span className="text-gray-300 font-semibold">{selectedMunicipality.total_tables}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mesas con testigo:</span>
              <span className="text-emerald-400 font-semibold">{selectedMunicipality.tables_covered}</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-gray-900/95 border border-gray-700 rounded-lg p-3 z-10">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Alcance Territorial</div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span className="text-gray-400">Municipio en alcance</span>
        </div>
      </div>
    </div>
  );
}
