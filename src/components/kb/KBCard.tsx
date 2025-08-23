import React from "react";
import { FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Variant = "blue" | "purple" | "green";

const VARIANTS: Record<Variant, { bg: string; border: string; tab: string; accent: string; ring: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", tab: "bg-blue-100", accent: "text-blue-600", ring: "ring-blue-200" },
  purple: { bg: "bg-violet-50", border: "border-violet-200", tab: "bg-violet-100", accent: "text-violet-600", ring: "ring-violet-200" },
  green: { bg: "bg-emerald-50", border: "border-emerald-200", tab: "bg-emerald-100", accent: "text-emerald-600", ring: "ring-emerald-200" },
};

interface KBCardProps {
  to: string;
  title: string;
  editedLabel?: string;
  variant?: Variant;
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export function KBCard({ title, editedLabel, variant = "blue", Icon = FileText, to }: KBCardProps) {
  const v = VARIANTS[variant];
  return (
    <Link
      to={to}
      className={cn(
        "relative block overflow-hidden rounded-2xl p-4 pb-16 border shadow-md hover:shadow-xl transition-shadow duration-150",
        v.bg, v.border
      )}
    >
      {/* Tab */}
      <div className={cn("inline-flex items-center gap-2 px-3 py-2 rounded-xl rounded-bl-sm shadow-inner shadow-black/5", v.tab)}>
        <span className="text-lg">{variant === "blue" ? "📄" : variant === "purple" ? "📝" : "💡"}</span>
        <span className="font-semibold text-slate-900 truncate">{title}</span>
      </div>

      {/* Body */}
      <div className="mt-5 grid gap-4">
        {editedLabel && (
          <div className="text-xs text-slate-600">Last edited <span className="font-semibold text-slate-900">{editedLabel}</span></div>
        )}
      </div>

      {/* Big icon as illustration */}
      <Icon className={cn("absolute right-6 top-1/2 -translate-y-1/2 w-24 h-24 opacity-10 drop-shadow", v.accent)} strokeWidth={1.5} />
    </Link>
  );
}