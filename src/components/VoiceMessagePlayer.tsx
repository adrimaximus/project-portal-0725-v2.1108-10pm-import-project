import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User } from '@/types';
import { generatePastelColor } from '@/lib/utils';

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
    <div className="flex items-center gap-2 w-full max-w-[280px] min-w-[240px] p-2">
      <audio ref={audioRef} src={src} preload="metadata" />
      <Button 
        variant="default"
        size="icon" 
        onClick={togglePlayPause} 
        className="h-9 w-9 flex-shrink-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <Slider
          value={[currentTime]}
          max={duration || 1}
          step={0.1}
          onValueChange={handleSliderChange}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="w-full [&>span:first-child]:h-1 [&>span:first-child>span]:bg-blue-500 [&>span:last-child]:h-3 [&>span:last-child]:w-3 [&>span:last-child]:bg-blue-500"
        />
        <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-muted-foreground">{formatTime(currentTime)}</span>
            <span className="text-xs font-mono text-muted-foreground">{formatTime(duration)}</span>
        </div>
      </div>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 flex-shrink-0 ml-2">
          <AvatarImage src={sender.avatar_url} />
          <AvatarFallback style={generatePastelColor(sender.id)}>{sender.initials}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default VoiceMessagePlayer;