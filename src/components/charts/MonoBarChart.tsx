import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { MONO, SERIES } from "./palette";

type Series = { key: string; label: string };

type Props<T extends Record<string, unknown>> = {
  data: T[];
  xKey: keyof T & string;
  series: Series[];
  height?: number;
  layout?: "horizontal" | "vertical";
  yFormatter?: (n: number) => string;
};

export function MonoBarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  height = 280,
  layout = "horizontal",
  yFormatter,
}: Props<T>) {
  const isVertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 8, right: 12, bottom: 0, left: isVertical ? 12 : 0 }}
      >
        <CartesianGrid stroke={MONO.border} strokeDasharray="2 4" />
        {isVertical ? (
          <>
            <XAxis
              type="number"
              tick={{ fill: MONO.mid, fontSize: 11 }}
              stroke={MONO.border}
              tickLine={false}
              tickFormatter={yFormatter}
            />
            <YAxis
              dataKey={xKey}
              type="category"
              tick={{ fill: MONO.mid, fontSize: 11 }}
              stroke={MONO.border}
              tickLine={false}
              width={120}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fill: MONO.mid, fontSize: 11 }}
              stroke={MONO.border}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: MONO.mid, fontSize: 11 }}
              stroke={MONO.border}
              tickLine={false}
              width={56}
              tickFormatter={yFormatter}
            />
          </>
        )}
        <Tooltip
          cursor={{ fill: MONO.bgAlt }}
          contentStyle={{
            background: MONO.bg,
            border: `1px solid ${MONO.border}`,
            borderRadius: 6,
            fontSize: 12,
            color: MONO.fg,
          }}
          itemStyle={{ color: MONO.fg }}
          labelStyle={{ color: MONO.mid }}
          formatter={(v: unknown) =>
            typeof v === "number" && yFormatter ? yFormatter(v) : String(v)
          }
        />
        <Legend wrapperStyle={{ fontSize: 11, color: MONO.mid }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={SERIES[i % SERIES.length]}
            radius={isVertical ? [0, 2, 2, 0] : [2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
