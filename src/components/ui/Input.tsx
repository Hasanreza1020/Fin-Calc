import { forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, error, className = "", id, ...rest },
  ref
) {
  const inputId = id ?? rest.name;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={`input-base ${error ? "border-white" : ""} ${className}`}
        {...rest}
      />
      {hint && !error && <p className="text-xs text-secondary">{hint}</p>}
      {error && <p className="text-xs text-white">{error}</p>}
    </div>
  );
});
