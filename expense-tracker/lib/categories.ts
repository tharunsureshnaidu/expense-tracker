export const CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Health",
  "Housing",
  "Shopping",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

interface CategoryStyle {
  badge: string;    // pill background + text
  activePill: string; // selected filter pill
  bar: string;      // progress bar fill
  dot: string;      // colored dot
  border: string;   // left border on row
}

const STYLES: Record<string, CategoryStyle> = {
  Food:          { badge: "bg-orange-100 text-orange-700",  activePill: "bg-orange-500 text-white",  bar: "bg-orange-400",  dot: "bg-orange-400",  border: "border-orange-400"  },
  Transport:     { badge: "bg-sky-100 text-sky-700",        activePill: "bg-sky-500 text-white",      bar: "bg-sky-400",     dot: "bg-sky-400",     border: "border-sky-400"     },
  Entertainment: { badge: "bg-violet-100 text-violet-700",  activePill: "bg-violet-500 text-white",  bar: "bg-violet-400",  dot: "bg-violet-400",  border: "border-violet-400"  },
  Health:        { badge: "bg-rose-100 text-rose-700",      activePill: "bg-rose-500 text-white",    bar: "bg-rose-400",    dot: "bg-rose-400",    border: "border-rose-400"    },
  Housing:       { badge: "bg-teal-100 text-teal-700",      activePill: "bg-teal-500 text-white",    bar: "bg-teal-400",    dot: "bg-teal-400",    border: "border-teal-400"    },
  Shopping:      { badge: "bg-amber-100 text-amber-700",    activePill: "bg-amber-500 text-white",   bar: "bg-amber-400",   dot: "bg-amber-400",   border: "border-amber-400"   },
  Other:         { badge: "bg-slate-100 text-slate-600",    activePill: "bg-slate-500 text-white",   bar: "bg-slate-400",   dot: "bg-slate-400",   border: "border-slate-400"   },
};

const FALLBACK: CategoryStyle = STYLES["Other"];

export function categoryStyle(cat: string): CategoryStyle {
  return STYLES[cat] ?? FALLBACK;
}
