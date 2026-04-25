import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export type ComboOption = {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
};

type Props = {
  value: string | null;
  onChange: (v: string | null) => void;
  options: ComboOption[];
  placeholder?: string;
  label?: string;
  emptyText?: string;
  className?: string;
};

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select…",
  label,
  emptyText = "No matches",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQuery("");
  }, [open]);

  const filtered = query
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.hint?.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && <label className="label">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input-base text-left flex items-center justify-between gap-2"
      >
        <span className={selected ? "text-white" : "text-subtle"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="text-secondary shrink-0" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-char border border-border rounded-lg shadow-xl animate-fade-in">
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border">
            <Search size={14} className="text-secondary" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="bg-transparent flex-1 text-sm outline-none placeholder:text-subtle"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-secondary">
                {emptyText}
              </div>
            ) : (
              filtered.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  disabled={o.disabled}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate flex items-center justify-between gap-2 ${
                    o.disabled ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="truncate">
                    <span className="text-white">{o.label}</span>
                    {o.hint && (
                      <span className="text-secondary ml-2 text-xs">
                        {o.hint}
                      </span>
                    )}
                  </span>
                  {o.value === value && (
                    <Check size={14} className="text-white" />
                  )}
                </button>
              ))
            )}
          </div>
          {value && (
            <div className="border-t border-border p-1">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-secondary hover:text-white hover:bg-slate rounded"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
