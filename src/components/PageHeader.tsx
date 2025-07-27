import { cn } from "@/lib/utils";
import React from "react";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

function PageHeader({
  className,
  children,
  as: Comp = "section",
  ...props
}: PageHeaderProps) {
  return (
    <Comp className={cn("grid gap-1", className)} {...props}>
      {children}
    </Comp>
  );
}

interface PageHeaderHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

function PageHeaderHeading({
  className,
  as: Comp = "h1",
  ...props
}: PageHeaderHeadingProps) {
  return (
    <Comp
      className={cn(
        "font-bold text-3xl tracking-tight md:text-4xl",
        className
      )}
      {...props}
    />
  );
}

interface PageHeaderDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

function PageHeaderDescription({
  className,
  ...props
}: PageHeaderDescriptionProps) {
  return (
    <p
      className={cn("text-lg text-muted-foreground", className)}
      {...props}
    />
  );
}

export { PageHeader, PageHeaderHeading, PageHeaderDescription };