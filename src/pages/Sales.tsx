import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ShoppingCart, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { presetRange, fmtDateTime, fmtDate, type DateRange } from "@/lib/dates";
import { fmtAED } from "@/lib/money";
import { useSales, useDeleteSale } from "@/hooks/queries/useSales";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

export function Sales() {
  const [range, setRange] = useState<DateRange>(presetRange("last30"));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const sales = useSales({ from: range.from, to: range.to });
  const del = useDeleteSale();
  const { isOwner } = useAuth();
  const { push } = useToast();

  const total = sales.data?.reduce((s, x) => s + Number(x.total_amount), 0) ?? 0;
  const profit =
    sales.data?.reduce(
      (s, sale) =>
        s +
        sale.items.reduce(
          (t, it) =>
            t +
            (Number(it.unit_price) - Number(it.unit_cost_at_sale)) *
              Number(it.quantity),
          0
        ),
      0
    ) ?? 0;

  return (
    <>
      <PageHeader
        title="Sales"
        description="All money IN from sales."
        actions={
          <Link to="/sales/new">
            <Button>
              <Plus size={14} /> New sale
            </Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <DateRangePicker value={range} onChange={setRange} />
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-secondary">
            {fmtDate(range.from)} – {fmtDate(range.to)}
          </span>
          <span className="font-mono tabular-nums">
            <span className="text-secondary">Revenue: </span>
            <span className="text-white">{fmtAED(total)}</span>
          </span>
          <span className="font-mono tabular-nums">
            <span className="text-secondary">Gross profit: </span>
            <span className="text-white">{fmtAED(profit)}</span>
          </span>
        </div>
      </Card>

      <Card padded={false}>
        {sales.isLoading ? (
          <div className="p-10 flex justify-center">
            <Spinner />
          </div>
        ) : !sales.data || sales.data.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={28} />}
            title="No sales yet in this range"
            action={
              <Link to="/sales/new">
                <Button>
                  <Plus size={14} /> New sale
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {sales.data.map((s) => {
              const open = expanded[s.id];
              return (
                <div key={s.id}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate cursor-pointer"
                    onClick={() =>
                      setExpanded((m) => ({ ...m, [s.id]: !open }))
                    }
                  >
                    {open ? (
                      <ChevronDown size={14} className="text-secondary" />
                    ) : (
                      <ChevronRight size={14} className="text-secondary" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {s.customer?.name || s.customer_name || "Walk-in"}
                        {s.customer?.phone && (
                          <span className="text-secondary text-xs font-normal ml-2">
                            · {s.customer.phone}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-secondary">
                        {fmtDateTime(s.sale_date)} ·{" "}
                        <span className="capitalize">{s.payment_method}</span>{" "}
                        · {s.items.length} line{s.items.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="font-mono tabular-nums text-sm text-white">
                      {fmtAED(s.total_amount)}
                    </div>
                    {isOwner && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("Delete this sale? Stock will revert.")) return;
                          try {
                            await del.mutateAsync(s.id);
                            push("Sale deleted");
                          } catch (err: unknown) {
                            push(
                              err instanceof Error ? err.message : "Failed",
                              "error"
                            );
                          }
                        }}
                        className="btn-ghost px-2 py-1"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  {open && (
                    <div className="bg-slate px-4 pb-3 pt-1">
                      <table className="table-base">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th className="text-right">Qty</th>
                            <th className="text-right">Unit price</th>
                            <th className="text-right">Cost @ sale</th>
                            <th className="text-right">Margin</th>
                            <th className="text-right">Line total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.items.map((it) => {
                            const margin =
                              (Number(it.unit_price) -
                                Number(it.unit_cost_at_sale)) *
                              Number(it.quantity);
                            return (
                              <tr key={it.id}>
                                <td>{it.product?.name ?? "—"}</td>
                                <td className="text-right font-mono tabular-nums">
                                  {it.quantity}
                                </td>
                                <td className="text-right font-mono tabular-nums">
                                  {fmtAED(it.unit_price)}
                                </td>
                                <td className="text-right font-mono tabular-nums text-secondary">
                                  {fmtAED(it.unit_cost_at_sale)}
                                </td>
                                <td className="text-right font-mono tabular-nums">
                                  {fmtAED(margin)}
                                </td>
                                <td className="text-right font-mono tabular-nums">
                                  {fmtAED(it.line_total)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {s.notes && (
                        <div className="text-xs text-secondary mt-2">
                          Notes: {s.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
