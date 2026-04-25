import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
};

export function Card({
  title,
  description,
  actions,
  padded = true,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <div className={`card ${className}`} {...rest}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5">
          <div>
            {title && (
              <div className="text-sm font-medium text-white">{title}</div>
            )}
            {description && (
              <div className="text-xs text-secondary mt-0.5">{description}</div>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-4 sm:p-5" : ""}>{children}</div>
    </div>
  );
}
