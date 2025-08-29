import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User } from '@/types';
import { generateVibrantGradient } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface VoiceMessagePlayerProps {
  src: string;
  sender: User;
  timestamp: string;
  isCurrentUser: boolean;
}

const formatTime = (time: number) => {
  if (isNaN(time) || !isFinite(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat('default', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);
    } catch (e) {
      return "";
    }
};

const VoiceMessagePlayer = ({ src, sender, timestamp, isCurrentUser }: VoiceMessagePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onEnded);

    if (audio.readyState >= 1) {
        setAudioData();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

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
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-[280px] min-w-[240px] p-2">
      <audio ref={audioRef} src={src} preload="metadata" />
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={sender.avatar_url} />
        <AvatarFallback style={generateVibrantGradient(sender.id)}>{sender.initials}</AvatarFallback>
      </Avatar>
      <Button variant="ghost" size="icon" onClick={togglePlayPause} className="h-8 w-8 flex-shrink-0">
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div className="flex-1 flex flex-col justify-center gap-1 relative pt-2">
        <Slider
          value={[currentTime]}
          max={duration || 1}
          step={0.1}
          onValueChange={handleSliderChange}
          className="w-full [&>span:first-child]:h-1 [&>span:first-child>span]:h-1 [&>span:last-child]:h-3 [&>span:last-child]:w-3"
        />
        <div className="flex justify-between items-center mt-1">
            <span className="text-xs font-mono">{formatTime(currentTime)}</span>
            <div className="flex items-center gap-2">
                <span className="text-xs font-mono">{formatTime(duration)}</span>
                <span className={cn(
                    "text-xs",
                    isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                    {formatTimestamp(timestamp)}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;