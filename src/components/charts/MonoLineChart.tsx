import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { MONO, SERIES } from "./palette";

type Series = { key: string; label: string; dashed?: boolean };

type Props<T extends Record<string, unknown>> = {
  data: T[];
  xKey: keyof T & string;
  series: Series[];
  height?: number;
  yFormatter?: (n: number) => string;
};

export function MonoLineChart<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  height = 280,
  yFormatter,
}: Props<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
      >
        <CartesianGrid stroke={MONO.border} strokeDasharray="2 4" />
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
        <Tooltip
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
        <Legend
          wrapperStyle={{ fontSize: 11, color: MONO.mid }}
          iconType="line"
        />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={SERIES[i % SERIES.length]}
            strokeWidth={1.75}
            strokeDasharray={s.dashed ? "4 3" : undefined}
            dot={false}
            activeDot={{ r: 3, fill: MONO.fg, stroke: MONO.fg }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
