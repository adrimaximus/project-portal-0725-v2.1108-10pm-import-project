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
      "flex items-center gap-3 w-full max-w-md min-w-[260px] p-2.5 rounded-2xl border transition-all shadow-sm",
      // Styling to look like an attachment card
      isCurrentUser 
        ? "bg-primary/5 border-primary/10" 
        : "bg-card border-border"
    )}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <Button 
        variant="default"
        size="icon" 
        onClick={togglePlayPause} 
        className={cn(
          "h-10 w-10 flex-shrink-0 rounded-full shadow-sm transition-all",
          isCurrentUser 
            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
            : "bg-primary text-primary-foreground hover:bg-primary/90"
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
            "[&>span:first-child]:h-1 [&>span:first-child]:bg-muted", // Track
            "[&>span:first-child>span]:bg-primary", // Range
            "[&>span:last-child]:h-3.5 [&>span:last-child]:w-3.5 [&>span:last-child]:border-2 [&>span:last-child]:border-background [&>span:last-child]:bg-primary [&>span:last-child]:shadow-sm hover:[&>span:last-child]:scale-110 transition-all" // Thumb
          )}
        />
        <div className="flex justify-between items-center px-0.5">
            <span className="text-[10px] font-medium text-muted-foreground tabular-nums leading-none">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground tabular-nums leading-none">
              {formatTime(duration)}
            </span>
        </div>
      </div>
      
      {/* Always show avatar if sender info is available, or keep !isCurrentUser if strictly for received messages. 
          Based on the image which shows the avatar on the right (typical for 'sender' in the card context), 
          we'll allow it to render but maybe styling differs. 
          For now, preserving existing logic: only render if !isCurrentUser to avoid duplicate avatars in chat stream if handled by parent.
          However, to match the "attachment" look perfectly as requested, I will render it if it's an attachment style.
      */}
      {!isCurrentUser && (
        <div className="relative flex-shrink-0 ml-1">
          <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
            <AvatarImage src={sender.avatar_url} />
            <AvatarFallback style={generatePastelColor(sender.id)}>{sender.initials}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-primary border-2 border-background text-primary-foreground">
            <Mic className="h-2 w-2" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceMessagePlayer;