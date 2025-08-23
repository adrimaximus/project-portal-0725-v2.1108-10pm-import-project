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
  header_image_url?: string;
}

export function KBCard({ title, editedLabel, variant = "blue", Icon = FileText, to, header_image_url }: KBCardProps) {
  const v = VARIANTS[variant];
  return (
    <Link
      to={to}
      className={cn(
        "relative block overflow-hidden rounded-2xl p-4 pb-16 border shadow-md hover:shadow-xl transition-shadow duration-150",
        !header_image_url && v.bg, 
        !header_image_url && v.border
      )}
    >
      {header_image_url ? (
        <div className="absolute inset-0">
          <img src={header_image_url} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <Icon className={cn("absolute right-6 top-1/2 -translate-y-1/2 w-24 h-24 opacity-10 drop-shadow", v.accent)} strokeWidth={1.5} />
      )}

      <div className="relative">
        {/* Tab */}
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-xl rounded-bl-sm",
          header_image_url ? "bg-black/30 backdrop-blur-sm" : cn(v.tab, "shadow-inner shadow-black/5")
        )}>
          <span className={cn("text-lg", header_image_url && "text-white/80")}>{variant === "blue" ? "📄" : variant === "purple" ? "📝" : "💡"}</span>
          <span className={cn("font-semibold truncate", header_image_url ? "text-white" : "text-slate-900")}>{title}</span>
        </div>

        {/* Body */}
        <div className="mt-5 grid gap-4">
          {editedLabel && (
            <div className={cn("text-xs", header_image_url ? "text-white/80" : "text-slate-600")}>
              Last edited <span className={cn("font-semibold", header_image_url ? "text-white" : "text-slate-900")}>{editedLabel}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}