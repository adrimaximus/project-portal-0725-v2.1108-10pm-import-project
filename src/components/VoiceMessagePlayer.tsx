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
      "flex items-center gap-3 w-full min-w-[240px] p-2 select-none"
    )}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <Button 
        variant="ghost"
        size="icon" 
        onClick={togglePlayPause} 
        className={cn(
          "h-8 w-8 flex-shrink-0 rounded-full shadow-sm transition-all",
          isCurrentUser 
            ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90" 
            : "bg-background text-primary hover:bg-background/90"
        )}
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </Button>
      
      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <Slider
          value={[currentTime]}
          max={duration || 1}
          step={0.1}
          onValueChange={handleSliderChange}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className={cn(
            "w-full py-1.5 cursor-pointer",
            // Track, Range, and Thumb colors based on isCurrentUser
            isCurrentUser 
              ? "[&>span:first-child]:bg-primary-foreground/30 [&>span:first-child>span]:bg-primary-foreground [&>span:last-child]:border-primary-foreground [&>span:last-child]:bg-primary-foreground" 
              : "[&>span:first-child]:bg-primary/20 [&>span:first-child>span]:bg-primary [&>span:last-child]:border-primary [&>span:last-child]:bg-primary"
          )}
        />
        <div className={cn(
            "flex justify-between items-center text-[10px] font-medium tabular-nums leading-none",
            isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {!isCurrentUser && (
        <div className="relative flex-shrink-0 ml-1">
          <Avatar className="h-8 w-8 border border-background/20 shadow-sm">
            <AvatarImage src={sender.avatar_url} />
            <AvatarFallback className="text-[10px]" style={generatePastelColor(sender.id)}>{sender.initials}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 flex items-center justify-center h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[8px] ring-2 ring-background">
            <Mic className="h-2 w-2" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceMessagePlayer;