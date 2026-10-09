import { ReactNode } from "react";

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>{children}</span>;
}
