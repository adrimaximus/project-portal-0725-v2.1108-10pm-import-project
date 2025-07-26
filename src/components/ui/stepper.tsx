import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import React from "react";

export const Stepper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("flex items-center justify-center gap-4", className)}>
    {children}
  </div>
);

export const StepperItem = ({ children, isCurrent, isCompleted }: { children: React.ReactNode, isCurrent?: boolean, isCompleted?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all",
      isCompleted ? "bg-primary text-primary-foreground" :
      isCurrent ? "border-2 border-primary text-primary" :
      "bg-muted text-muted-foreground"
    )}>
      {isCompleted ? <Check className="h-5 w-5" /> : ''}
    </div>
    <span className={cn("font-medium transition-colors", isCurrent || isCompleted ? "text-primary" : "text-muted-foreground")}>{children}</span>
  </div>
);

export const StepperSeparator = () => (
  <div className="flex-1 h-px bg-border" />
);