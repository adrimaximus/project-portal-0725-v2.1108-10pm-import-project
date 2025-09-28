import { useState, useEffect } from 'react';

interface BrowserInfo {
  isArc: boolean;
  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isMobile: boolean;
  isPrivateMode: boolean;
  cookiesEnabled: boolean;
  localStorageEnabled: boolean;
  version?: string;
}

export const useBrowserDetection = () => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    isArc: false,
    isChrome: false,
    isSafari: false,
    isFirefox: false,
    isEdge: false,
    isMobile: false,
    isPrivateMode: false,
    cookiesEnabled: false,
    localStorageEnabled: false,
  });

  useEffect(() => {
    const detectBrowser = async () => {
      const userAgent = navigator.userAgent;
      
      // Browser detection
      const isArc = userAgent.includes('Arc');
      const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edge') && !isArc;
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
      const isFirefox = userAgent.includes('Firefox');
      const isEdge = userAgent.includes('Edge');
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

      // Check cookies
      const cookiesEnabled = navigator.cookieEnabled;

      // Check localStorage
      let localStorageEnabled = false;
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        localStorageEnabled = true;
      } catch (e) {
        localStorageEnabled = false;
      }

      // Check private mode
      let isPrivateMode = false;
      try {
        const db = indexedDB.open('test');
        isPrivateMode = await new Promise((resolve) => {
          db.onsuccess = () => resolve(false);
          db.onerror = () => resolve(true);
        });
      } catch {
        isPrivateMode = true;
      }

      setBrowserInfo({
        isArc,
        isChrome,
        isSafari,
        isFirefox,
        isEdge,
        isMobile,
        isPrivateMode,
        cookiesEnabled,
        localStorageEnabled,
      });
    };

    detectBrowser();
  }, []);

  const getCompatibilityWarnings = () => {
    const warnings: string[] = [];

    if (browserInfo.isArc) {
      warnings.push('Arc browser may block authentication cookies. Consider disabling "Block Trackers" for this site.');
    }

    if (browserInfo.isPrivateMode) {
      warnings.push('Private/Incognito mode detected. Authentication may not work properly.');
    }

    if (!browserInfo.cookiesEnabled) {
      warnings.push('Cookies are disabled. Please enable cookies for authentication to work.');
    }

    if (!browserInfo.localStorageEnabled) {
      warnings.push('Local storage is disabled. This may affect session persistence.');
    }

    if (browserInfo.isSafari) {
      warnings.push('Safari users: Make sure "Prevent cross-site tracking" is disabled for this site.');
    }

    return warnings;
  };

  const isCompatible = () => {
    return browserInfo.cookiesEnabled && browserInfo.localStorageEnabled && !browserInfo.isPrivateMode;
  };

  return {
    browserInfo,
    getCompatibilityWarnings,
    isCompatible,
  };
};