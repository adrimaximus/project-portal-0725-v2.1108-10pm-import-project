import { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { Trash2, Send, Pause, Mic } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';

interface VoiceMessageRecorderProps {
  onSend: (file: File) => void;
  disabled?: boolean;
}

const VoiceMessageRecorder = ({ onSend, disabled }: VoiceMessageRecorderProps) => {
  const { isRecording, recordingTime, audioBlob, startRecording, stopRecording, cancelRecording, resetRecorder } = useAudioRecorder();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [audioBlob]);

  const handleSend = () => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
      onSend(audioFile);
      resetRecorder();
    }
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
        <Button variant="ghost" size="icon" onClick={resetRecorder} className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        <div className="flex-1 mx-2">
          <AudioPlayer src={previewUrl} />
        </div>
        <Button size="icon" onClick={handleSend} className="h-8 w-8 bg-primary">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={startRecording} disabled={disabled}>
      <Mic className="h-5 w-5" />
    </Button>
  );
};

export default VoiceMessageRecorder;