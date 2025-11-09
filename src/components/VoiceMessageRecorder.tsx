import { useState, useEffect, useRef } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { Trash2, Send, Pause, Mic, Play } from 'lucide-react';

interface VoiceMessageRecorderProps {
  onSend: (file: File) => void;
  disabled?: boolean;
}

const VoiceMessageRecorder = ({ onSend, disabled }: VoiceMessageRecorderProps) => {
  const { isRecording, recordingTime, audioBlob, startRecording, stopRecording, cancelRecording, resetRecorder } = useAudioRecorder();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [audioBlob]);

  useEffect(() => {
    const audio = audioPreviewRef.current;
    if (audio) {
        const handleEnd = () => setIsPreviewPlaying(false);
        audio.addEventListener('ended', handleEnd);
        return () => audio.removeEventListener('ended', handleEnd);
    }
  }, [previewUrl]);

  const handleSend = () => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
      onSend(audioFile);
      resetRecorder();
    }
  };

  const togglePreview = () => {
    const audio = audioPreviewRef.current;
    if (!audio) return;
    if (isPreviewPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
    setIsPreviewPlaying(!isPreviewPlaying);
  };

  if (isRecording) {
    return (
      <div className="flex items-center justify-between w-full h-10 px-3 bg-muted rounded-md">
        <Button variant="ghost" size="icon" onClick={cancelRecording} className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="font-mono text-sm">{new Date(recordingTime * 1000).toISOString().substr(14, 5)}</span>
        </div>
        <Button size="icon" onClick={stopRecording} className="h-8 w-8 bg-primary">
          <Pause className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (audioBlob && previewUrl) {
    return (
      <div className="flex items-center justify-between w-full h-10 px-3 bg-muted rounded-md">
        <audio ref={audioPreviewRef} src={previewUrl} />
        <Button variant="ghost" size="icon" onClick={resetRecorder} className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={togglePreview} className="h-8 w-8">
                {isPreviewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="w-24 h-1 bg-gray-300 rounded-full" />
            <span className="font-mono text-sm">{new Date(recordingTime * 1000).toISOString().substr(14, 5)}</span>
        </div>
        <Button size="icon" onClick={handleSend} className="h-8 w-8 bg-primary">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={startRecording} disabled={disabled}>
      <Mic className="h-8 w-8" />
    </Button>
  );
};

export default VoiceMessageRecorder;