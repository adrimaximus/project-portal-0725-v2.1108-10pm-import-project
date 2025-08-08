"use client";

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    cloudinary: any;
  }
}

const CloudinaryVideoPlayer = () => {
  const videoContainerRef = useRef(null);

  useEffect(() => {
    // Ensure the Cloudinary script is loaded
    if (window.cloudinary && videoContainerRef.current) {
      const player = window.cloudinary.player(videoContainerRef.current, {
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
  }, []);

  return (
    <div 
      ref={videoContainerRef} 
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
    />
  );
};

export default CloudinaryVideoPlayer;