import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

interface AudioContextType {
  play: (src: string) => void;
  unlockAudio: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.volume = 0.5;
  }

  const play = useCallback((src: string) => {
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
        if (error.name === 'NotAllowedError') {
          toast.error("Could not play sound.", {
            description: "Browser blocked autoplay. Please interact with the page first.",
          });
        } else {
          toast.error("Audio playback error.", {
            description: error.message,
          });
        }
      });
    }
  }, []);

  const unlockAudio = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      audioRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <AudioContext.Provider value={{ play, unlockAudio }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};