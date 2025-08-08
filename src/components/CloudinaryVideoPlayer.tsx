"use client";

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    cloudinary: any;
  }
}

const CloudinaryVideoPlayer = () => {
  const videoContainerRef = useRef(null);
  const playerRef = useRef<any>(null); // To store the player instance

  useEffect(() => {
    let intervalId: number;

    const initializePlayer = () => {
      // Check if the script is loaded and the player function is available
      if (window.cloudinary && typeof window.cloudinary.player === 'function' && videoContainerRef.current) {
        // Clear the interval since we've found the player
        if (intervalId) {
          clearInterval(intervalId);
        }

        // Prevent re-initialization
        if (!playerRef.current) {
          playerRef.current = window.cloudinary.player(videoContainerRef.current, {
            cloudName: 'dxqonns7y',
            publicId: 'Pin_on_Diseñadora_ui5u0u',
            profile: 'cld-default',
            autoplay: true,
            loop: true,
            muted: true,
            controls: false,
            width: '100%',
            height: '100%',
            crop: 'fill',
            gravity: 'auto',
          });
        }
      }
    };

    // Try to initialize immediately
    initializePlayer();

    // If it's not ready, set an interval to check again
    if (!playerRef.current) {
      intervalId = window.setInterval(initializePlayer, 200);
    }

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Optional: destroy the player instance on unmount
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.error("Error disposing Cloudinary player:", e);
        }
        playerRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div 
      ref={videoContainerRef} 
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
    />
  );
};

export default CloudinaryVideoPlayer;