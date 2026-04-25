type Cell = { row: number; col: number; value: number };

type Props = {
  cells: Cell[];
  rowLabels: string[];
  colLabels: string[];
  formatter?: (v: number) => string;
};

export function Heatmap({ cells, rowLabels, colLabels, formatter }: Props) {
  const max = cells.reduce((m, c) => Math.max(m, c.value), 0) || 1;

  function shade(value: number) {
    if (value <= 0) return "#0a0a0a";
    const t = Math.min(1, value / max);
    const lum = Math.round(20 + t * 200);
    return `rgb(${lum},${lum},${lum})`;
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
