import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

const LoadingScreen = () => {
  const { user } = useAuth();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(10);

  const messages = [
    `Welcome back, ${user?.name || 'friend'}! Authenticating...`,
    "Fetching your projects and goals...",
    "Preparing your workspace...",
    "Almost ready! Have a great day :)",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessageIndex((prevIndex) => {
        if (prevIndex >= messages.length - 1) {
          setProgress(100);
          return prevIndex;
        }
        setProgress((p) => p + 25);
        return prevIndex + 1;
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [messageIndex, messages.length]);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(25), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background animate-fade-in">
      <div className="text-center w-full max-w-sm px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <div className="h-8 mt-4">
          <p
            key={messageIndex}
            className="text-lg text-muted-foreground animate-fade-in"
          >
            {messages[messageIndex]}
          </p>
        </div>
        <Progress value={progress} className="w-full mt-4 transition-all" />
      </div>
    </div>
  );
};

export default LoadingScreen;