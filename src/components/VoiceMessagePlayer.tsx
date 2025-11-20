import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User } from '@/types';
import { generatePastelColor, cn } from '@/lib/utils';

interface VoiceMessagePlayerProps {
  src: string;
  sender: User;
  isCurrentUser: boolean;
}

const formatTime = (time: number) => {
  if (isNaN(time) || !isFinite(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const VoiceMessagePlayer = ({ src, sender, isCurrentUser }: VoiceMessagePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number>();
  const wasPlayingBeforeDragRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('ended', onEnded);
    if (audio.readyState >= 1) setAudioData();

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('ended', onEnded);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [src]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, updateProgress]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (value: number[]) => {
    const audio = audioRef.current;
    if (audio && isFinite(value[0])) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handlePointerDown = () => {
    if (audioRef.current) {
      wasPlayingBeforeDragRef.current = !audioRef.current.paused;
      if (wasPlayingBeforeDragRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handlePointerUp = () => {
    if (audioRef.current && wasPlayingBeforeDragRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
    wasPlayingBeforeDragRef.current = false;
  };

  return (
    <div className={cn(
      "flex items-center gap-3 w-full max-w-md min-w-[280px] p-3 rounded-[2rem] border shadow-sm select-none",
      // Attachment-like styling: Gray background, soft borders
      "bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
    )}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Play Button - Circular White */}
      <Button 
        variant="ghost"
        size="icon" 
        onClick={togglePlayPause} 
        className={cn(
          "h-10 w-10 flex-shrink-0 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all",
          "bg-white text-blue-600 hover:bg-white hover:text-blue-700",
          "dark:bg-gray-700 dark:text-blue-400 dark:hover:bg-gray-600"
        )}
      >
        {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
      </Button>
      
      {/* Slider & Time */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0 mr-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground tabular-nums w-6">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.1}
            onValueChange={handleSliderChange}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className="flex-1 py-1.5 cursor-pointer"
          />
          <span className="text-[10px] font-medium text-muted-foreground tabular-nums w-6 text-right">
            {formatTime(duration)}
          </span>
        </div>
      </div>
      
      {/* Avatar with Mic Badge */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800 shadow-sm">
          <AvatarImage src={sender.avatar_url} />
          <AvatarFallback style={generatePastelColor(sender.id)}>{sender.initials}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -left-1 z-10 flex items-center justify-center h-5 w-5 rounded-full bg-white dark:bg-gray-700 shadow-sm ring-2 ring-gray-100 dark:ring-gray-800">
          <Mic className="h-3 w-3 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;