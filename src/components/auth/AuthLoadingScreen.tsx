import { useState, useEffect } from "react";
import { Loader2, Package } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const AuthLoadingScreen = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(10);

  const messages = [
    "Authenticating...",
    "Verifying your session...",
    "Loading your workspace...",
    "Almost ready!",
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
    }, 800);

    return () => clearTimeout(timer);
  }, [messageIndex, messages.length]);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(25), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-900 animate-fade-in">
      <div className="text-center w-full max-w-sm px-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Package className="h-8 w-8 text-white" />
          <span className="text-xl font-bold text-white">Client Portal</span>
        </div>
        <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
        <div className="h-8 mt-4">
          <p
            key={messageIndex}
            className="text-lg text-white/80 animate-fade-in"
          >
            {messages[messageIndex]}
          </p>
        </div>
        <Progress value={progress} className="w-full mt-4 transition-all bg-gray-800" />
      </div>
    </div>
  );
};

export default AuthLoadingScreen;