import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Boxes,
  Plus,
  Receipt,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { MonoLineChart } from "@/components/charts/MonoLineChart";
import { useReportData } from "@/hooks/queries/useReports";
import { presetRange } from "@/lib/dates";
import { fmtAED, fmtAEDCompact } from "@/lib/money";
import { useProducts } from "@/hooks/queries/useProducts";
import { useInventoryUnits } from "@/hooks/queries/useInventory";
import { useSales } from "@/hooks/queries/useSales";
import { useAuth } from "@/lib/auth";
import { fmtDateTime } from "@/lib/dates";

export function Dashboard() {
  const { profile } = useAuth();
  const today = useReportData(presetRange("today"), "day");
  const month = useReportData(presetRange("thisMonth"), "day");
  const last30 = useReportData(presetRange("last30"), "day");
  const products = useProducts();
  const units = useInventoryUnits({ status: "in_stock" });
  const recentSales = useSales({ limit: 5 });

  const stockValue =
    (products.data ?? [])
      .filter((p) => p.track_mode === "batch")
      .reduce(
        (s, p) => s + Number(p.current_stock) * Number(p.default_cost),
        0
      ) +
    (units.data ?? []).reduce((s, u) => s + Number(u.cost), 0);

  const lowStock = (products.data ?? []).filter(
    (p) => p.track_mode === "batch" && Number(p.current_stock) <= 2
  );

  return (
    <>
      <PageHeader
        title={`Hello${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="At-a-glance view of your shop's cash flow."
        actions={
          <>
            <Link to="/sales/new">
              <Button>
                <Plus size={14} /> New sale
              </Button>
            </Link>
            <Link to="/purchases/new">
              <Button variant="secondary">
                <Plus size={14} /> Purchase
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard
          label="Today's revenue"
          value={fmtAED(today.data?.totals.revenue ?? 0)}
          icon={<TrendingUp size={14} />}
          hint={
            <span>{`Profit ${fmtAED(today.data?.totals.profit ?? 0)}`}</span>
          }
        />
        <KpiCard
          label="This month"
          value={fmtAED(month.data?.totals.revenue ?? 0)}
          icon={<Wallet size={14} />}
          hint={<span>{`Net ${fmtAED(month.data?.totals.net ?? 0)}`}</span>}
        />
        <KpiCard
          label="Stock value"
          value={fmtAED(stockValue)}
          icon={<Boxes size={14} />}
          hint={
            <span>
              {(products.data ?? []).length} SKUs · {units.data?.length ?? 0}{" "}
              units
            </span>
          }
        />
        <KpiCard
          label="Low stock"
          value={lowStock.length}
          icon={<TrendingDown size={14} />}
          hint={
            lowStock.length > 0 ? (
              <Link to="/inventory" className="text-white underline">
                view
              </Link>
            ) : (
              <span>—</span>
            )
          }
        />
      </div>

      <Card title="Last 30 days · cash flow" className="mb-5">
        {last30.isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <Spinner />
          </div>
        ) : last30.data && last30.data.rows.length > 0 ? (
          <MonoLineChart
            data={last30.data.rows}
            xKey="label"
            series={[
              { key: "revenue", label: "Revenue (in)" },
              { key: "expenses", label: "Expenses (out)", dashed: true },
              { key: "profit", label: "Net profit" },
            ]}
            yFormatter={fmtAEDCompact}
          />
        ) : (
          <div className="h-[280px] flex items-center justify-center text-secondary text-sm">
            No data yet — record a sale or purchase to see this chart.
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          title="Recent sales"
          actions={
            <Link to="/sales" className="text-xs text-secondary hover:text-white">
              View all
            </Link>
          }
          padded={false}
        >
          {recentSales.isLoading ? (
            <div className="p-10 flex justify-center">
              <Spinner />
            </div>
          ) : (recentSales.data ?? []).length === 0 ? (
            <div className="p-6 text-sm text-secondary">No sales yet.</div>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Customer</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.data!.map((s) => (
                  <tr key={s.id}>
                    <td className="text-secondary text-xs whitespace-nowrap">
                      {fmtDateTime(s.sale_date)}
                    </td>
                    <td>{s.customer_name || "Walk-in"}</td>
                    <td className="text-right font-mono tabular-nums">
                      {fmtAED(s.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card
          title="Quick links"
          actions={null}
        >
          <div className="grid grid-cols-2 gap-2">
            <QuickLink to="/inventory" icon={<Boxes size={14} />} label="Inventory" />
            <QuickLink to="/products" icon={<Package size={14} />} label="Products" />
            <QuickLink to="/expenses" icon={<Receipt size={14} />} label="Cash flow" />
            <QuickLink to="/reports" icon={<TrendingUp size={14} />} label="Reports" />
          </div>
        </Card>
      </div>
    </>
  );
}

function QuickLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2.5 rounded border border-border hover:bg-slate text-sm"
    >
      <span className="text-secondary">{icon}</span>
      <span className="text-white">{label}</span>
    </Link>
  );
}
