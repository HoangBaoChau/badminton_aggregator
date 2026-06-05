"use client";

import React from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import styles from './GoogleMapViewer.module.css';
import { useTheme } from '@/contexts/ThemeContext';

// Dark mode styles for Google Maps
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

interface GoogleMapViewerProps {
  center: google.maps.LatLngLiteral;
  zoom?: number;
  children?: React.ReactNode;
}

export default function GoogleMapViewer({ 
  center, 
  zoom = 13, 
  children
}: GoogleMapViewerProps) {
  const { theme } = useTheme();
  
  return (
    <div className={styles.mapContainer}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          defaultCenter={center}
          center={center}
          defaultZoom={zoom}
          zoom={zoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          styles={theme === 'dark' ? darkMapStyles : []}
          style={{ width: '100%', height: '100%' }}
        >
          {children}
        </Map>
      </APIProvider>
    </div>
  );
}
