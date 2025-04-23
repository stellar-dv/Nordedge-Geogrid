import React, { useEffect, useRef, useState } from 'react';
import { useGridContext } from '@/contexts/GridContext';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 0,
  lng: 0
};

const mapOptions = {
  styles: [
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [{ color: "#ffffff" }, { lightness: 17 }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }, { lightness: 18 }],
    },
    {
      featureType: "road.local",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }, { lightness: 16 }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }, { lightness: 21 }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#dedede" }, { lightness: 21 }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ visibility: "on" }, { color: "#ffffff" }, { lightness: 16 }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ saturation: 36 }, { color: "#333333" }, { lightness: 40 }],
    },
    {
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#f2f2f2" }, { lightness: 19 }],
    },
    {
      featureType: "administrative",
      elementType: "geometry.fill",
      stylers: [{ color: "#fefefe" }, { lightness: 20 }],
    },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#fefefe" }, { lightness: 17 }, { weight: 1.2 }],
    },
  ],
};

export function GridVisualization() {
  const { points, config, isLoading } = useGridContext();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && points.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach(point => {
        bounds.extend({ lat: point.lat, lng: point.lng });
      });
      mapRef.current.fitBounds(bounds);
    }
  }, [points]);

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute top-4 right-4 bg-white p-2 rounded shadow">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
      {locationError && (
        <div className="absolute top-4 left-4 bg-red-100 text-red-800 p-2 rounded shadow">
          {locationError}
        </div>
      )}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || defaultCenter}
        zoom={userLocation ? 12 : 10}
        options={mapOptions}
        onLoad={(map: google.maps.Map) => {
          mapRef.current = map;
        }}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            }}
            title="Your Location"
          />
        )}
        {points.map((point, index) => (
          <Marker
            key={index}
            position={{ lat: point.lat, lng: point.lng }}
            icon={{
              url: index === Math.floor(config.size * config.size / 2)
                ? 'https://localviking.com/icons/preview-draggable.png'
                : 'https://localviking.com/icons/preview-default.png',
              scaledSize: new google.maps.Size(
                index === Math.floor(config.size * config.size / 2) ? 24 : 16,
                index === Math.floor(config.size * config.size / 2) ? 24 : 16
              ),
              anchor: new google.maps.Point(
                index === Math.floor(config.size * config.size / 2) ? 12 : 8,
                index === Math.floor(config.size * config.size / 2) ? 12 : 8
              ),
            }}
            title={index === Math.floor(config.size * config.size / 2) ? 'Center Point' : `Grid Point ${index}`}
          />
        ))}
      </GoogleMap>
    </div>
  );
} 