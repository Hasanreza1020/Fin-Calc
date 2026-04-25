import { useMono } from "./palette";

type Cell = { row: number; col: number; value: number };

type Props = {
  cells: Cell[];
  rowLabels: string[];
  colLabels: string[];
  formatter?: (v: number) => string;
};

function hexToRgb(h: string): [number, number, number] {
  const s = h.replace("#", "");
  const v = parseInt(s.length === 3 ? s.split("").map((c) => c + c).join("") : s, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

export function Heatmap({ cells, rowLabels, colLabels, formatter }: Props) {
  const MONO = useMono();
  const max = cells.reduce((m, c) => Math.max(m, c.value), 0) || 1;
  const [br, bg, bb] = hexToRgb(MONO.bg);
  const [fr, fg, fb] = hexToRgb(MONO.fg);

  function shade(value: number) {
    if (value <= 0) return MONO.bg;
    const t = Math.min(1, value / max) * 0.85 + 0.05;
    return `rgb(${lerp(br, fr, t)},${lerp(bg, fg, t)},${lerp(bb, fb, t)})`;
  }

  const grid: number[][] = rowLabels.map(() =>
    colLabels.map(() => 0)
  );
  for (const c of cells) {
    if (grid[c.row]) grid[c.row][c.col] = c.value;
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-[2px]">
        <thead>
          <tr>
            <th className="w-12"></th>
            {colLabels.map((c) => (
              <th
                key={c}
                className="text-[10px] text-secondary font-normal text-center w-7"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((r, ri) => (
            <tr key={r}>
              <td className="text-[10px] text-secondary pr-2 text-right whitespace-nowrap">
                {r}
              </td>
              {colLabels.map((_, ci) => {
                const v = grid[ri][ci];
                return (
                  <td
                    key={ci}
                    title={formatter ? formatter(v) : String(v)}
                    className="w-7 h-7 rounded-sm border border-border"
                    style={{ background: shade(v) }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
