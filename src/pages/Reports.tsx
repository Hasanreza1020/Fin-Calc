import { useMemo, useState } from "react";
import { Download, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { MonoLineChart } from "@/components/charts/MonoLineChart";
import { MonoBarChart } from "@/components/charts/MonoBarChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { presetRange, type DateRange, type Granularity } from "@/lib/dates";
import { fmtAED, fmtAEDCompact } from "@/lib/money";
import {
  useReportData,
  useProductBreakdown,
  useSalesHeatmap,
  useExpenseBreakdown,
} from "@/hooks/queries/useReports";
import { useProducts } from "@/hooks/queries/useProducts";
import { useInventoryUnits } from "@/hooks/queries/useInventory";
import { downloadCSV, toCSV } from "@/lib/csv";
import { KpiCard } from "@/components/ui/KpiCard";

const GRANULARITIES: { v: Granularity; label: string }[] = [
  { v: "day", label: "Daily" },
  { v: "week", label: "Weekly" },
  { v: "month", label: "Monthly" },
  { v: "year", label: "Yearly" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0")
);

export function Reports() {
  const [range, setRange] = useState<DateRange>(presetRange("thisMonth"));
  const [gran, setGran] = useState<Granularity>("day");

  const main = useReportData(range, gran);
  const breakdown = useProductBreakdown(range);
  const heat = useSalesHeatmap(range);
  const expBreak = useExpenseBreakdown(range);
  const products = useProducts({ includeArchived: true });
  const units = useInventoryUnits({ status: "in_stock" });

  const stockValue = useMemo(() => {
    const batch = (products.data ?? [])
      .filter((p) => p.track_mode === "batch")
      .reduce((s, p) => s + Number(p.current_stock) * Number(p.default_cost), 0);
    const perUnit = (units.data ?? []).reduce(
      (s, u) => s + Number(u.cost),
      0
    );
    return { batch, perUnit, total: batch + perUnit };
  }, [products.data, units.data]);

  const stockByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products.data ?? []) {
      if (p.track_mode !== "batch") continue;
      const v = Number(p.current_stock) * Number(p.default_cost);
      const k = p.category?.name ?? "Uncategorised";
      map.set(k, (map.get(k) ?? 0) + v);
    }
    for (const u of units.data ?? []) {
      const product = (products.data ?? []).find(
        (p) => p.id === u.product_id
      );
      const k = product?.category?.name ?? "Uncategorised";
      map.set(k, (map.get(k) ?? 0) + Number(u.cost));
    }
    return Array.from(map.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }, [products.data, units.data]);

  function exportCashflow() {
    if (!main.data) return;
    downloadCSV(
      `cashflow-${range.from.toISOString().slice(0, 10)}-${range.to
        .toISOString()
        .slice(0, 10)}`,
      toCSV(
        main.data.rows.map((r) => ({
          period: r.label,
          revenue: r.revenue.toFixed(2),
          cost_of_goods: r.cost.toFixed(2),
          expenses: r.expenses.toFixed(2),
          other_income: r.otherIncome.toFixed(2),
          profit: r.profit.toFixed(2),
          net_cashflow: r.net.toFixed(2),
        }))
      )
    );
  }
  function exportProducts() {
    if (!breakdown.data) return;
    downloadCSV(
      `products-${range.from.toISOString().slice(0, 10)}`,
      toCSV(
        breakdown.data.products.map((p) => ({
          product: p.name,
          qty: p.qty,
          revenue: p.revenue.toFixed(2),
          cost: p.cost.toFixed(2),
          profit: p.profit.toFixed(2),
          margin_pct: (p.margin * 100).toFixed(1),
        }))
      )
    );
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Cashflow, profit, top sellers, stock value & more."
      />

      <Card className="mb-4">
        <DateRangePicker value={range} onChange={setRange} />
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
          <span className="text-xs text-secondary mr-2">Granularity</span>
          {GRANULARITIES.map((g) => (
            <button
              key={g.v}
              onClick={() => setGran(g.v)}
              className={gran === g.v ? "pill-on" : "pill"}
            >
              {g.label}
            </button>
          ))}
          <div className="flex-1" />
          <Button variant="secondary" size="sm" onClick={exportCashflow}>
            <Download size={13} /> CSV
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Revenue" value={fmtAED(main.data?.totals.revenue ?? 0)} />
        <KpiCard label="Cost of goods" value={fmtAED(main.data?.totals.cost ?? 0)} />
        <KpiCard label="Expenses" value={fmtAED(main.data?.totals.expenses ?? 0)} />
        <KpiCard label="Net profit" value={fmtAED(main.data?.totals.profit ?? 0)} />
      </div>

      <Card title="Cashflow timeline" className="mb-4">
        {main.isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <Spinner />
          </div>
        ) : main.data && main.data.rows.length > 0 ? (
          <MonoLineChart
            data={main.data.rows}
            xKey="label"
            series={[
              { key: "revenue", label: "Revenue (in)" },
              { key: "expenses", label: "Expenses (out)", dashed: true },
              { key: "otherIncome", label: "Other income" },
              { key: "profit", label: "Profit" },
            ]}
            yFormatter={fmtAEDCompact}
          />
        ) : (
          <Empty />
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Top products by revenue" actions={
          <Button variant="secondary" size="sm" onClick={exportProducts}>
            <Download size={13} /> CSV
          </Button>
        }>
          {breakdown.isLoading ? (
            <div className="h-[280px] flex items-center justify-center">
              <Spinner />
            </div>
          ) : breakdown.data && breakdown.data.products.length > 0 ? (
            <MonoBarChart
              data={breakdown.data.products.slice(0, 10).reverse()}
              xKey="name"
              layout="vertical"
              series={[
                { key: "revenue", label: "Revenue" },
                { key: "profit", label: "Profit" },
              ]}
              yFormatter={fmtAEDCompact}
              height={Math.max(220, 30 * Math.min(10, breakdown.data.products.length))}
            />
          ) : (
            <Empty />
          )}
        </Card>

        <Card title="Profit by category">
          {breakdown.isLoading ? (
            <div className="h-[280px] flex items-center justify-center">
              <Spinner />
            </div>
          ) : breakdown.data && breakdown.data.categories.length > 0 ? (
            <MonoBarChart
              data={breakdown.data.categories}
              xKey="name"
              layout="vertical"
              series={[{ key: "profit", label: "Profit" }]}
              yFormatter={fmtAEDCompact}
              height={Math.max(220, 30 * breakdown.data.categories.length)}
            />
          ) : (
            <Empty />
          )}
        </Card>
      </div>

      <Card title="Margin per product" className="mb-4" padded={false}>
        {breakdown.data && breakdown.data.products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Qty sold</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Profit</th>
                  <th className="text-right">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.data.products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="text-right font-mono tabular-nums">{p.qty}</td>
                    <td className="text-right font-mono tabular-nums">
                      {fmtAED(p.revenue)}
                    </td>
                    <td className="text-right font-mono tabular-nums text-secondary">
                      {fmtAED(p.cost)}
                    </td>
                    <td className="text-right font-mono tabular-nums">
                      {fmtAED(p.profit)}
                    </td>
                    <td className="text-right font-mono tabular-nums">
                      {(p.margin * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <Empty />
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Sales heatmap (day × hour)">
          {heat.isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Spinner />
            </div>
          ) : heat.data && heat.data.length > 0 ? (
            <Heatmap
              cells={heat.data}
              rowLabels={DAY_LABELS}
              colLabels={HOUR_LABELS}
              formatter={fmtAED}
            />
          ) : (
            <Empty />
          )}
        </Card>

        <Card title="Expense breakdown">
          {expBreak.isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Spinner />
            </div>
          ) : expBreak.data && expBreak.data.length > 0 ? (
            <MonoBarChart
              data={expBreak.data}
              xKey="category"
              series={[{ key: "amount", label: "Amount" }]}
              yFormatter={fmtAEDCompact}
            />
          ) : (
            <Empty />
          )}
        </Card>
      </div>

      <Card title="Stock value on hand">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <KpiCard label="Total stock value" value={fmtAED(stockValue.total)} />
          <KpiCard label="Batch SKUs value" value={fmtAED(stockValue.batch)} />
          <KpiCard label="Per-unit value" value={fmtAED(stockValue.perUnit)} />
        </div>
        {stockByCategory.length > 0 ? (
          <MonoBarChart
            data={stockByCategory}
            xKey="category"
            layout="vertical"
            series={[{ key: "value", label: "Stock value" }]}
            yFormatter={fmtAEDCompact}
            height={Math.max(220, 28 * stockByCategory.length)}
          />
        ) : (
          <Empty />
        )}
      </Card>
    </>
  );
}

function Empty() {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center text-secondary text-sm gap-1">
      <BarChart3 size={20} />
      <span>No data in selected range</span>
    </div>
  );
}
