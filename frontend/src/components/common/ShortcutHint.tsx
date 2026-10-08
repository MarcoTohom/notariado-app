import React from "react";

/** Chip visual de atajo de teclado (kbd) junto a las acciones (WP-08). */
export const ShortcutHint: React.FC<{ combo: string; label?: string }> = ({ combo, label }) => (
  <span className="inline-flex items-center gap-1" title={label}>
    <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold shadow-[0_1px_0_rgba(0,0,0,0.08)]">
      {combo}
    </kbd>
    {label && <span className="text-[10px] text-slate-400">{label}</span>}
  </span>
);
