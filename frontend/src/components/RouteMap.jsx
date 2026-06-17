import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset paths under Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

const RouteMap = ({
  mode = 'view', // 'view' or 'interactive'
  sourceLat,
  sourceLng,
  destinationLat,
  destinationLng,
  onChangeCoords, // callback when markers are placed: (type, lat, lng, address)
  height = '350px'
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const sourceMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  // Helper function for Nominatim reverse geocoding
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&email=coride-app@example.com`);
      const data = await res.json();
      return data.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
  };

  // Initialize Map
  useEffect(() => {
    if (mapRef.current) return; // Only init once

    const initialLat = sourceLat || 20.5937;
    const initialLng = sourceLng || 78.9629;
    const initialZoom = sourceLat ? 12 : 5;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], initialZoom);
    mapRef.current = map;

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // If interactive mode, handle map clicks to update parent coordinates
    if (mode === 'interactive') {
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        
        if (!sourceLat) {
          const address = await reverseGeocode(lat, lng);
          if (onChangeCoords) onChangeCoords('source', lat, lng, address);
        } else if (!destinationLat) {
          const address = await reverseGeocode(lat, lng);
          if (onChangeCoords) onChangeCoords('destination', lat, lng, address);
        } else {
          // Both set, reset destination and set new source
          if (onChangeCoords) {
            onChangeCoords('destination', null, null, '');
            const address = await reverseGeocode(lat, lng);
            onChangeCoords('source', lat, lng, address);
          }
        }
      });
    }
  }, [mode, sourceLat, destinationLat, onChangeCoords]);

  // Sync markers and polyline when props change (externally or from click/drag)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // 1. Sync Source Marker
    if (sourceLat && sourceLng) {
      const latlng = [sourceLat, sourceLng];
      if (sourceMarkerRef.current) {
        const currentPos = sourceMarkerRef.current.getLatLng();
        if (currentPos.lat !== sourceLat || currentPos.lng !== sourceLng) {
          sourceMarkerRef.current.setLatLng(latlng);
        }
      } else {
        sourceMarkerRef.current = L.marker(latlng, { draggable: mode === 'interactive' })
          .addTo(map)
          .bindPopup('<b>Source</b>');

        if (mode === 'interactive') {
          sourceMarkerRef.current.on('dragend', async (event) => {
            const marker = event.target;
            const position = marker.getLatLng();
            const address = await reverseGeocode(position.lat, position.lng);
            marker.bindPopup(`<b>Source:</b> ${address}`).openPopup();
            if (onChangeCoords) onChangeCoords('source', position.lat, position.lng, address);
          });
        }
      }
    } else {
      if (sourceMarkerRef.current) {
        map.removeLayer(sourceMarkerRef.current);
        sourceMarkerRef.current = null;
      }
    }

    // 2. Sync Destination Marker
    if (destinationLat && destinationLng) {
      const latlng = [destinationLat, destinationLng];
      if (destMarkerRef.current) {
        const currentPos = destMarkerRef.current.getLatLng();
        if (currentPos.lat !== destinationLat || currentPos.lng !== destinationLng) {
          destMarkerRef.current.setLatLng(latlng);
        }
      } else {
        destMarkerRef.current = L.marker(latlng, { draggable: mode === 'interactive' })
          .addTo(map)
          .bindPopup('<b>Destination</b>');

        if (mode === 'interactive') {
          destMarkerRef.current.on('dragend', async (event) => {
            const marker = event.target;
            const position = marker.getLatLng();
            const address = await reverseGeocode(position.lat, position.lng);
            marker.bindPopup(`<b>Destination:</b> ${address}`).openPopup();
            if (onChangeCoords) onChangeCoords('destination', position.lat, position.lng, address);
          });
        }
      }
    } else {
      if (destMarkerRef.current) {
        map.removeLayer(destMarkerRef.current);
        destMarkerRef.current = null;
      }
    }

    // 3. Draw/Sync Polyline
    if (sourceLat && sourceLng && destinationLat && destinationLng) {
      const coords = [[sourceLat, sourceLng], [destinationLat, destinationLng]];
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs(coords);
      } else {
        routeLineRef.current = L.polyline(coords, {
          color: 'var(--accent-primary)',
          weight: 4,
          dashArray: '5, 10'
        }).addTo(map);
      }

      // Auto-fit bounds
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }

      // If only one exists, center on it
      if (sourceLat && sourceLng) {
        map.setView([sourceLat, sourceLng], 12);
      } else if (destinationLat && destinationLng) {
        map.setView([destinationLat, destinationLng], 12);
      }
    }
  }, [sourceLat, sourceLng, destinationLat, destinationLng, mode, onChangeCoords]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div ref={mapContainerRef} style={{ height, width: '100%', borderRadius: 'var(--radius-md)' }} />
      {mode === 'interactive' && (
        <div style={styles.helpText}>
          {!sourceLat 
            ? "Click on map to set your Source Location"
            : !destinationLat 
              ? "Click on map to set your Destination Location"
              : "Drag markers to refine route. Click again to reset."
          }
        </div>
      )}
    </div>
  );
};

const styles = {
  helpText: {
    position: 'absolute',
    top: '10px',
    left: '50px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    boxShadow: 'var(--glass-shadow)',
    pointerEvents: 'none',
    zIndex: 1000,
  }
};

export default RouteMap;
