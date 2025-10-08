import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Slider } from './ui/slider';
import { User } from '@/types';
import { generatePastelColor } from '@/lib/utils';

interface VoiceMessagePlayerProps {
  src: string;
  sender: User;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function VoiceMessagePlayer({ src, sender }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [isDragging]);

  const togglePlayPause = () => {
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
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg w-full max-w-sm">
      <audio ref={audioRef} src={src} preload="metadata" />
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full h-10 w-10 flex-shrink-0"
        onClick={togglePlayPause}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>
      <div className="flex-grow flex items-center gap-2">
        <div className="w-full">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSliderChange}
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={() => setIsDragging(false)}
          />
        </div>
        <span className="text-xs text-muted-foreground w-10 text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={sender.avatar_url} />
          <AvatarFallback style={{ backgroundColor: generatePastelColor(sender.id) }}>{sender.initials}</AvatarFallback>
        </Avatar>
      </div>
      <Button variant="ghost" size="icon" asChild>
        <a href={src} download>
          <Download className="h-5 w-5" />
        </a>
      </Button>
    </div>
  );
}