import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { errorClass } from "./formStyles";

export function FieldError({ children }: { children: ReactNode }) {
  return <p role="alert" className={errorClass}>{children}</p>;
}

export function ErrorNotice({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div role="alert" className={`bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3.5 py-2.5 rounded-lg ${className}`}>{children}</div>;
}

export function LoadingState({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" className={`flex items-center justify-center text-slate-400 ${className}`}>
      <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin mr-2" />
      {children}
    </div>
  );
}
