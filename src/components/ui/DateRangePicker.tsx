import { useState } from "react";
import { presetRange, toISODate, type DateRange } from "@/lib/dates";

type Props = {
  value: DateRange;
  onChange: (r: DateRange) => void;
};

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7d" },
  { key: "thisWeek", label: "This week" },
  { key: "lastWeek", label: "Last week" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "last30", label: "Last 30d" },
  { key: "last90", label: "Last 90d" },
  { key: "thisYear", label: "This year" },
] as const;

export function DateRangePicker({ value, onChange }: Props) {
  const [active, setActive] = useState<string>("custom");

  function applyPreset(p: (typeof PRESETS)[number]["key"]) {
    setActive(p);
    onChange(presetRange(p));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => applyPreset(p.key)}
            className={active === p.key ? "pill-on" : "pill hover:text-white"}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="label">From</label>
          <input
            type="date"
            value={toISODate(value.from)}
            max={toISODate(value.to)}
            onChange={(e) => {
              setActive("custom");
              const d = new Date(e.target.value);
              d.setHours(0, 0, 0, 0);
              onChange({ ...value, from: d });
            }}
            className="input-base"
          />
        </div>
        <div className="flex-1">
          <label className="label">To</label>
          <input
            type="date"
            value={toISODate(value.to)}
            min={toISODate(value.from)}
            onChange={(e) => {
              setActive("custom");
              const d = new Date(e.target.value);
              d.setHours(23, 59, 59, 999);
              onChange({ ...value, to: d });
            }}
            className="input-base"
          />
        </div>
      </div>
    </div>
  );
}
