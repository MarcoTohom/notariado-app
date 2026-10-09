import { createContext } from "react";
export const FileActivityContext = createContext<
  ((delta: number) => void) | null
>(null);
