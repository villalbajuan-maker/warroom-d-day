import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { PollingPlaceMapData } from '../services/map-data-service';
import { toGeoJSON } from '../services/map-data-service';

interface MapViewProps {
  pollingPlaces: PollingPlaceMapData[];
  onPlaceClick: (place: PollingPlaceMapData) => void;
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView({ pollingPlaces, onPlaceClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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

      map.current.addLayer({
        id: 'polling-places-empty',
        type: 'circle',
        source: 'polling-places',
        filter: ['==', ['get', 'status'], 'empty'],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 1.5,
            7, 3,
            9, 5,
            11, 8,
            13, 12
          ],
          'circle-color': '#6b7280',
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#4b5563'
        }
      });

      map.current.addLayer({
        id: 'polling-places-assigned',
        type: 'circle',
        source: 'polling-places',
        filter: ['==', ['get', 'status'], 'assigned'],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 2,
            7, 4,
            9, 6,
            11, 10,
            13, 14
          ],
          'circle-color': '#fbbf24',
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#f59e0b'
        }
      });

      map.current.addLayer({
        id: 'polling-places-active',
        type: 'circle',
        source: 'polling-places',
        filter: ['==', ['get', 'status'], 'active'],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 2,
            7, 4,
            9, 6,
            11, 10,
            13, 14
          ],
          'circle-color': '#34d399',
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#10b981'
        }
      });

      map.current.addLayer({
        id: 'polling-places-incident',
        type: 'circle',
        source: 'polling-places',
        filter: ['==', ['get', 'status'], 'incident'],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 2.5,
            7, 5,
            9, 7,
            11, 12,
            13, 16
          ],
          'circle-color': '#ef4444',
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#dc2626'
        }
      });

      const layerIds = [
        'polling-places-empty',
        'polling-places-assigned',
        'polling-places-active',
        'polling-places-incident'
      ];

      layerIds.forEach(layerId => {
        map.current!.on('click', layerId, (e) => {
          if (e.features && e.features[0]) {
            const properties = e.features[0].properties;
            const place: PollingPlaceMapData = {
              polling_place_id: properties!.polling_place_id,
              polling_place_name: properties!.polling_place_name,
              municipality_name: properties!.municipality_name,
              total_tables: properties!.total_tables,
              tables_with_witness: properties!.tables_with_witness,
              tables_checked_in: properties!.tables_checked_in,
              incident_count: properties!.incident_count,
              latitude: null,
              longitude: null,
              status: properties!.status
            };
            onPlaceClick(place);
          }
        });

        map.current!.on('mouseenter', layerId, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });

        map.current!.on('mouseleave', layerId, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
        });
      });
    }

    if (pollingPlaces.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      pollingPlaces.forEach(place => {
        if (place.latitude && place.longitude) {
          bounds.extend([place.longitude, place.latitude]);
        }
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [mapLoaded, pollingPlaces, onPlaceClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}
