import { useState, useEffect } from 'react';

const SCRIPT_ID = 'google-maps-places-script';
const CALLBACK_NAME = 'initGoogleMapsApi';

const useGoogleMapsScript = (apiKey: string | undefined) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError(new Error("Google Maps API key is missing."));
      return;
    }

    // Check if the API is already loaded
    if ((window as any).google && (window as any).google.maps) {
      setIsLoaded(true);
      return;
    }

    const handleLoad = () => setIsLoaded(true);

    // If script is already loading, just listen for our custom event
    if (document.getElementById(SCRIPT_ID)) {
      window.addEventListener(CALLBACK_NAME, handleLoad);
      return () => window.removeEventListener(CALLBACK_NAME, handleLoad);
    }

    // Define the callback function on the window object
    (window as any)[CALLBACK_NAME] = () => {
      // Dispatch a custom event for other instances of the hook
      window.dispatchEvent(new Event(CALLBACK_NAME));
      // Clean up the callback function from the window object
      delete (window as any)[CALLBACK_NAME];
    };
    
    // Add the listener for the component that initiated the load
    window.addEventListener(CALLBACK_NAME, handleLoad);

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${CALLBACK_NAME}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      const err = new Error('Google Maps script failed to load.');
      setError(err);
      console.error(err);
      delete (window as any)[CALLBACK_NAME];
    };

    document.head.appendChild(script);

    return () => {
      window.removeEventListener(CALLBACK_NAME, handleLoad);
    };
  }, [apiKey]);

  return { isLoaded, error };
};

export default useGoogleMapsScript;