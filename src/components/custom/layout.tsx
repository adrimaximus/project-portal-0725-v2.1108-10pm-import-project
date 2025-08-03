import { cn } from "@/lib/utils";
import React from "react";

const Layout = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "h-screen flex flex-col",
      className
    )}
    {...props}
  />
);

const LayoutHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("shrink-0", className)}
    {...props}
  />
);

const LayoutBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 overflow-y-auto", className)}
    {...props}
  />
);

export { Layout, LayoutHeader, LayoutBody };