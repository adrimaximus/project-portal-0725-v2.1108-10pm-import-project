import { useState, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import PortalLayout from '@/components/PortalLayout';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Default center to Jakarta, Indonesia
const defaultCenter = {
  lat: -6.2088,
  lng: 106.8456
};

const libraries: ("places")[] = ["places"];

const MapPage = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || "",
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const location = place.geometry.location;
        const newCenter = {
          lat: location.lat(),
          lng: location.lng(),
        };
        setCenter(newCenter);
        setMarkerPosition(newCenter);
        map?.panTo(newCenter);
        map?.setZoom(15);
      }
    }
  };

  if (loadError) {
    return (
        <PortalLayout>
            <div className="flex items-center justify-center h-full">
                <p className="text-destructive">Error loading maps. Please check your API key and internet connection.</p>
            </div>
        </PortalLayout>
    );
  }

  return (
    <PortalLayout noPadding disableMainScroll>
      <div className="relative h-full w-full">
        {isLoaded ? (
          <>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
                options={{
                  fields: ['geometry', 'name', 'formatted_address'],
                  componentRestrictions: { country: ['id'] }
                }}
              >
                <Input
                  id="place"
                  placeholder="Cari lokasi di Indonesia..."
                  className="shadow-lg"
                />
              </Autocomplete>
            </div>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={10}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
              }}
            >
              {markerPosition && <Marker position={markerPosition} />}
            </GoogleMap>
          </>
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>
    </PortalLayout>
  );
};

export default MapPage;