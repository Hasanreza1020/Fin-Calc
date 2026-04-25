import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
};

export function KpiCard({ label, value, delta, hint, icon }: Props) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-secondary font-medium">
          {label}
        </div>
        {icon && <div className="text-secondary">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-white">
        {value}
      </div>
      {(delta || hint) && (
        <div className="mt-1.5 text-xs text-secondary flex items-center gap-2">
          {delta}
          {hint}
        </div>
      )}
    </div>
  );
}
