import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, hint, className = "", id, children, ...rest },
  ref
) {
  const selectId = id ?? rest.name;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={`input-base appearance-none pr-9 ${className}`}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
        />
      </div>
      {hint && <p className="text-xs text-secondary">{hint}</p>}
    </div>
  );
});
