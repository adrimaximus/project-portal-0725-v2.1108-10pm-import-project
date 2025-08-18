import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LoadingScreen = () => {
  const { user } = useAuth();
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    `Welcome back, ${user?.name || 'friend'}!`,
    "Already have your coffee or tea cup?",
    "I'm preparing your workspace...",
    "Have a betterworks today :)",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessageIndex((prevIndex) => {
        if (prevIndex >= messages.length - 1) {
          return prevIndex;
        }
        return prevIndex + 1;
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [messageIndex, messages.length]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background animate-fade-in">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <div className="h-8 mt-4">
          <p
            key={messageIndex}
            className="text-lg text-muted-foreground animate-fade-in"
          >
            {messages[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;