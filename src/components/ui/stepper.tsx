import { cn } from "@/lib/utils";
import React from "react";

const Stepper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-center w-full">{children}</div>
  );
};

const StepperItem = ({
  isActive,
  isCompleted,
  children,
}: {
  isActive: boolean;
  isCompleted: boolean;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border-2",
          isCompleted
            ? "bg-primary border-primary text-primary-foreground"
            : isActive
            ? "border-primary"
            : "border-muted-foreground"
        )}
      >
        {isCompleted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isActive && "bg-primary"
            )}
          />
        )}
      </div>
      <p
        className={cn(
          "text-sm mt-2 text-center",
          isActive ? "font-semibold text-primary" : "text-muted-foreground"
        )}
      >
        {children}
      </p>
    </div>
  );
};

const StepperSeparator = () => {
  return <div className="flex-1 h-px bg-border mx-4"></div>;
};

export { Stepper, StepperItem, StepperSeparator };