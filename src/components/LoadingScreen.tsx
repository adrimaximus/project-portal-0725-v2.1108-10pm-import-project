import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const LoadingScreen = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(10);

  const messages = [
    "Loading your workspace...",
    "Connecting to services...",
    "Preparing your dashboard...",
    "Almost there...",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessageIndex((prevIndex) => {
        if (prevIndex >= messages.length - 1) {
          setProgress(90);
          return prevIndex;
        }
        setProgress((p) => Math.min(p + 25, 90));
        return prevIndex + 1;
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [messageIndex, messages.length]);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(25), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background animate-fade-in">
      <div className="text-center w-full max-w-xs px-4 space-y-6">
        <div className="flex justify-center">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
            </div>
        </div>
        <div className="h-8">
          <p
            key={messageIndex}
            className="text-lg font-medium text-muted-foreground animate-fade-in-up"
          >
            {messages[messageIndex]}
          </p>
        </div>
        <Progress value={progress} className="w-full h-2 rounded-full" />
      </div>
    </div>
  );
};

export default LoadingScreen;