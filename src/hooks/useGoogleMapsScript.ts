import { useState, useEffect } from 'react';

const useGoogleMapsScript = (apiKey: string | undefined) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError(new Error("Google Maps API key is missing."));
      return;
    }

    if ((window as any).google && (window as any).google.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-places-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const handleLoad = () => {
      setIsLoaded(true);
    };

    const handleError = () => {
      const err = new Error('Google Maps script failed to load.');
      setError(err);
      console.error(err);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
      document.head.appendChild(script);
    } else {
      // If script exists, it might be loading or loaded.
      // Add listeners, but also check if it's already loaded.
      if ((window as any).google && (window as any).google.maps) {
        setIsLoaded(true);
      } else {
        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
      }
    };
  }, [apiKey]);

  return { isLoaded, error };
};

export default useGoogleMapsScript;