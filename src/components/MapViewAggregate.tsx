import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { PollingPlaceAggregateState } from '../types/control-room-services';

interface MapViewAggregateProps {
  pollingPlaces: PollingPlaceAggregateState[];
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

function getStatusColor(status: 'ok' | 'warning' | 'critical') {
  switch (status) {
    case 'ok': return '#34d399';
    case 'warning': return '#fbbf24';
    case 'critical': return '#ef4444';
  }
}

function toGeoJSON(places: PollingPlaceAggregateState[]) {
  const belloCoords = { lat: 6.3378, lng: -75.5564 };
  const barbosaCoords = { lat: 6.4391, lng: -75.3306 };

  const coordinatesMap = new Map<string, [number, number]>();
  const usedCoordinates = new Set<string>();

  places.forEach(place => {
    const municipalityName = place.municipality_name.toUpperCase();
    let baseCoords: { lat: number; lng: number } | null = null;

    if (municipalityName.includes('BELLO') && !municipalityName.includes('BARBOSA')) {
      baseCoords = belloCoords;
    } else if (municipalityName.includes('BARBOSA')) {
      baseCoords = barbosaCoords;
    } else {
      console.warn(`Unknown municipality coordinates for polling place: ${place.polling_place_name} in ${place.municipality_name}`);
      return;
    }

    let offset = 0.005;
    let coordinates: [number, number];
    let attempts = 0;

    do {
      const latOffset = (Math.random() - 0.5) * offset;
      const lngOffset = (Math.random() - 0.5) * offset;
      coordinates = [baseCoords.lng + lngOffset, baseCoords.lat + latOffset];
      const coordKey = `${coordinates[0].toFixed(4)},${coordinates[1].toFixed(4)}`;

      if (!usedCoordinates.has(coordKey)) {
        usedCoordinates.add(coordKey);
        break;
      }

      attempts++;
      if (attempts > 50) {
        offset += 0.002;
      }
    } while (attempts < 100);

    coordinatesMap.set(place.polling_place_id, coordinates);
  });

  const features = places
    .filter(place => coordinatesMap.has(place.polling_place_id))
    .map(place => ({
      type: 'Feature' as const,
      properties: {
        polling_place_id: place.polling_place_id,
        polling_place_name: place.polling_place_name,
        municipality_name: place.municipality_name,
        total_tables: place.total_tables,
        checked_in_tables: place.checked_in_tables,
        closed_tables: place.closed_tables,
        incidents_count: place.incidents_count,
        evidences_count: place.evidences_count,
        signals_count: place.signals_count,
        status: place.status
      },
      geometry: {
        type: 'Point' as const,
        coordinates: coordinatesMap.get(place.polling_place_id)!
      }
    }));

  return {
    type: 'FeatureCollection' as const,
    features
  };
}

export default function MapViewAggregate({ pollingPlaces }: MapViewAggregateProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PollingPlaceAggregateState | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-75.4435, 6.3885],
      zoom: 10,
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
    if (!map.current || !mapLoaded || pollingPlaces.length === 0) return;

    const geojson = toGeoJSON(pollingPlaces);

    if (map.current.getSource('polling-places')) {
      const source = map.current.getSource('polling-places') as mapboxgl.GeoJSONSource;
      source.setData(geojson);
    } else {
      map.current.addSource('polling-places', {
        type: 'geojson',
        data: geojson
      });

      ['ok', 'warning', 'critical'].forEach(status => {
        const radiusExpression = status === 'critical'
          ? ['interpolate', ['linear'], ['zoom'], 5, 2.5, 7, 5, 9, 7, 11, 12, 13, 16]
          : status === 'warning'
          ? ['interpolate', ['linear'], ['zoom'], 5, 2, 7, 4, 9, 6, 11, 10, 13, 14]
          : ['interpolate', ['linear'], ['zoom'], 5, 1.5, 7, 3, 9, 5, 11, 8, 13, 12];

        map.current!.addLayer({
          id: `polling-places-${status}`,
          type: 'circle',
          source: 'polling-places',
          filter: ['==', ['get', 'status'], status],
          paint: {
            'circle-radius': radiusExpression as any,
            'circle-color': getStatusColor(status as 'ok' | 'warning' | 'critical'),
            'circle-opacity': 0.9,
            'circle-stroke-width': 2,
            'circle-stroke-color': getStatusColor(status as 'ok' | 'warning' | 'critical')
          }
        });

        map.current!.on('click', `polling-places-${status}`, (e) => {
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            setSelectedPlace({
              polling_place_id: props!.polling_place_id,
              polling_place_name: props!.polling_place_name,
              municipality_name: props!.municipality_name,
              total_tables: props!.total_tables,
              checked_in_tables: props!.checked_in_tables,
              closed_tables: props!.closed_tables,
              incidents_count: props!.incidents_count,
              evidences_count: props!.evidences_count,
              signals_count: props!.signals_count,
              status: props!.status as 'ok' | 'warning' | 'critical'
            });
          }
        });

        map.current!.on('mouseenter', `polling-places-${status}`, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });

        map.current!.on('mouseleave', `polling-places-${status}`, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
        });
      });
    }

    if (pollingPlaces.length > 0) {
      const geojsonData = toGeoJSON(pollingPlaces);
      const bounds = new mapboxgl.LngLatBounds();
      geojsonData.features.forEach(feature => {
        bounds.extend(feature.geometry.coordinates as [number, number]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [mapLoaded, pollingPlaces]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />

      {selectedPlace && (
        <div className="absolute top-4 right-4 bg-gray-900/95 border border-gray-700 rounded-lg p-4 max-w-sm shadow-xl z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-200">{selectedPlace.polling_place_name}</div>
            <button onClick={() => setSelectedPlace(null)} className="text-gray-500 hover:text-gray-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Municipio:</span>
              <span className="text-gray-300">{selectedPlace.municipality_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total mesas:</span>
              <span className="text-gray-300">{selectedPlace.total_tables}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mesas reportando:</span>
              <span className="text-gray-300">{selectedPlace.checked_in_tables}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mesas cerradas:</span>
              <span className="text-gray-300">{selectedPlace.closed_tables}</span>
            </div>
            {selectedPlace.incidents_count > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Incidencias:</span>
                <span className="text-yellow-400 font-semibold">{selectedPlace.incidents_count}</span>
              </div>
            )}
            {selectedPlace.signals_count > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Señales críticas:</span>
                <span className="text-orange-400 font-semibold">{selectedPlace.signals_count}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-gray-900/95 border border-gray-700 rounded-lg p-3 z-10">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Leyenda</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            <span className="text-gray-400">Operando normal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span className="text-gray-400">Con alertas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Crítico</span>
          </div>
        </div>
      </div>
    </div>
  );
}
