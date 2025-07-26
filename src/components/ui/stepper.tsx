"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// --- Contexts ---

interface StepperContextValue {
  activeStep: number;
  orientation: "vertical" | "horizontal";
  stepCount: number;
}

const StepperContext = React.createContext<StepperContextValue | null>(null);

interface StepContextValue {
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isLastStep: boolean;
}

const StepContext = React.createContext<StepContextValue | null>(null);

// --- Hooks ---

const useStepperContext = () => {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("Stepper sub-components must be used within a <Stepper>.");
  }
  return context;
};

const useStepContext = () => {
  const context = React.useContext(StepContext);
  if (!context) {
    throw new Error("Step sub-components must be used within a <Step>.");
  }
  return context;
};

// --- Components ---

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  activeStep: number;
  orientation?: "vertical" | "horizontal";
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ children, className, activeStep, orientation = "vertical", ...props }, ref) => {
    const stepCount = React.Children.count(children);
    const contextValue = React.useMemo(
      () => ({ activeStep, orientation, stepCount }),
      [activeStep, orientation, stepCount]
    );

    return (
      <StepperContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            "flex w-full",
            orientation === "vertical" ? "flex-col" : "flex-row",
            className
          )}
          {...props}
        >
          {React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) return null;
            const stepContextValue = {
              index,
              isActive: index === activeStep,
              isCompleted: index < activeStep,
              isLastStep: index === stepCount - 1,
            };
            return (
              <StepContext.Provider value={stepContextValue}>
                {child}
              </StepContext.Provider>
            );
          })}
        </div>
      </StepperContext.Provider>
    );
  }
);
Stepper.displayName = "Stepper";

const Step = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    const { orientation } = useStepperContext();
    const { isLastStep } = useStepContext();

    const label = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.type === StepLabel
    );
    const content = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.type === StepContent
    );

    return (
      <div
        ref={ref}
        className={cn("flex", orientation === "vertical" ? "flex-col" : "flex-row items-start flex-1", className)}
        {...props}
      >
        <div className="flex items-center gap-4">
          {label}
        </div>
        <div
          className={cn(
            "relative",
            orientation === "vertical" && !isLastStep ? "min-h-8 border-l-2 ml-4 pl-8 py-4" : "",
            orientation === "horizontal" && !isLastStep ? "flex-1 border-t-2 mt-4 mx-4" : "",
          )}
        >
          {content}
        </div>
      </div>
    );
  }
);
Step.displayName = "Step";

const StepLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    const { index, isActive, isCompleted } = useStepContext();

    return (
      <div ref={ref} className="flex items-center gap-4" {...props}>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
            isActive ? "border-primary text-primary" : 
            isCompleted ? "border-primary bg-primary text-primary-foreground" : 
            "border-muted-foreground text-muted-foreground"
          )}
        >
          {isCompleted ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
        </div>
        <div
          className={cn(
            "text-lg font-medium transition-colors",
            isActive ? "text-primary" : 
            isCompleted ? "text-foreground" : 
            "text-muted-foreground",
            className
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);
StepLabel.displayName = "StepLabel";

const StepContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    const { isActive, orientation } = useStepContext();
    
    if (!isActive) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "w-full",
          orientation === "vertical" ? "" : "absolute top-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StepContent.displayName = "StepContent";

export { Stepper, Step, StepLabel, StepContent };