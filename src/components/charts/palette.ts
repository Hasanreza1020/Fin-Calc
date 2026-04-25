import { useMemo } from "react";
import { useTheme } from "@/lib/theme";

function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

export type Mono = {
  fg: string;
  fgDim: string;
  mid: string;
  midDim: string;
  border: string;
  bg: string;
  bgAlt: string;
};

export function useMono(): Mono {
  const { theme } = useTheme();
  return useMemo(
    () => ({
      fg: readVar("--c-white", "#ffffff"),
      fgDim: readVar("--c-divider", "#cccccc"),
      mid: readVar("--c-secondary", "#8a8a8a"),
      midDim: readVar("--c-subtle", "#5a5a5a"),
      border: readVar("--c-border", "#262626"),
      bg: readVar("--c-char", "#0a0a0a"),
      bgAlt: readVar("--c-slate", "#141414"),
    }),
    // re-read when theme flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );
}

export function useSeries(): string[] {
  const m = useMono();
  return useMemo(
    () => [m.fg, m.mid, m.midDim, m.fgDim, m.border],
    [m.fg, m.mid, m.midDim, m.fgDim, m.border]
  );
}
