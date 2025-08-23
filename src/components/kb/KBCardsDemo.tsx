import React from "react";
import { Camera, FileText, Video, Play } from "lucide-react";

/**
 * Tailwind React component replicating the "pastel header tab" KB cards.
 * - Responsive grid
 * - Avatar stack
 * - Variant colors (blue, purple, green)
 * - Big illustration/icon and play button
 */

type Variant = "blue" | "purple" | "green";

const VARIANTS: Record<Variant, { bg: string; border: string; tab: string; accent: string; ring: string }>= {
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   tab: "bg-blue-100",   accent: "text-blue-600",   ring: "ring-blue-200" },
  purple: { bg: "bg-violet-50", border: "border-violet-200", tab: "bg-violet-100", accent: "text-violet-600", ring: "ring-violet-200" },
  green:  { bg: "bg-emerald-50",border: "border-emerald-200",tab: "bg-emerald-100",accent: "text-emerald-600", ring: "ring-emerald-200" },
};

interface KBCardProps {
  title: string;
  filesCount?: number | string;
  avatars?: string[]; // array of avatar image URLs
  moreLabel?: string; // e.g. "+6"
  editedLabel?: string; // e.g. "8m ago"
  variant?: Variant;
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

function AvatarStack({ avatars = [], moreLabel }: { avatars?: string[]; moreLabel?: string }) {
  return (
    <div className="flex items-center">
      {avatars.slice(0,3).map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className={["w-7 h-7 rounded-full border-2 border-white shadow-sm", i>0? "-ml-2":""].join(" ")}
        />
      ))}
      {moreLabel && (
        <span className="-ml-2 grid place-items-center w-7 h-7 rounded-full border-2 border-white bg-slate-200 text-[11px] font-semibold text-slate-900 shadow-sm">
          {moreLabel}
        </span>
      )}
    </div>
  );
}

export function KBCard({ title, filesCount, avatars = [], moreLabel, editedLabel, variant = "blue", Icon = Camera }: KBCardProps) {
  const v = VARIANTS[variant];
  return (
    <article className={["relative overflow-hidden rounded-2xl p-4 pb-16", v.bg, v.border, "border shadow-md hover:shadow-xl transition-shadow duration-150"].join(" ")}
    >
      {/* Tab */}
      <div className={["inline-flex items-center gap-2 px-3 py-2 rounded-xl rounded-bl-sm", v.tab, "shadow-inner shadow-black/5"].join(" ")}
      >
        <span className="text-lg">{variant === "blue" ? "📷" : variant === "purple" ? "📄" : "📹"}</span>
        <span className="font-semibold text-slate-900">{title}</span>
      </div>

      {/* Files count */}
      {filesCount !== undefined && (
        <div className="absolute top-4 right-4 text-xs text-slate-600">{filesCount} files</div>
      )}

      {/* Body */}
      <div className="mt-5 grid gap-4">
        <div>
          <div className="text-xs text-slate-600 mb-2">Shared with</div>
          <AvatarStack avatars={avatars} moreLabel={moreLabel} />
        </div>
        {editedLabel && (
          <div className="text-xs text-slate-600">Last edited <span className="font-semibold text-slate-900">{editedLabel}</span></div>
        )}
      </div>

      {/* Big icon as illustration */}
      <Icon className={["absolute right-6 top-1/2 -translate-y-1/2 w-24 h-24 opacity-90 drop-shadow", v.accent].join(" ")} strokeWidth={1.5} />

      {/* Play button */}
      <button
        aria-label="Open"
        className={[
          "absolute right-3 bottom-3 grid place-items-center w-10 h-10 rounded-full bg-white",
          "border border-slate-200 shadow-lg hover:-translate-y-0.5 transition",
          v.accent,
        ].join(" ")}
      >
        <Play className="w-4 h-4" />
      </button>
    </article>
  );
}

export default function KBCardsDemo() {
  const avatars = [
    "https://i.pravatar.cc/32?img=11",
    "https://i.pravatar.cc/32?img=12",
    "https://i.pravatar.cc/32?img=13",
  ];

  return (
    <div className="w-full bg-background p-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <KBCard title="My Images" filesCount={1649} avatars={avatars} moreLabel="+6" editedLabel="8m ago" variant="blue" Icon={Camera} />
        <KBCard title="Documents" filesCount={1189} avatars={avatars} moreLabel="+6" editedLabel="12m ago" variant="purple" Icon={FileText} />
        <KBCard title="Videos" filesCount={846} avatars={avatars} moreLabel="+6" editedLabel="8m ago" variant="green" Icon={Video} />
      </div>
    </div>
  );
}