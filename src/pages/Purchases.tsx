import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, PackagePlus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { presetRange, fmtDate, type DateRange } from "@/lib/dates";
import { fmtAED } from "@/lib/money";
import { usePurchases, useDeletePurchase } from "@/hooks/queries/usePurchases";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

export function Purchases() {
  const [range, setRange] = useState<DateRange>(presetRange("last30"));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const purchases = usePurchases({ from: range.from, to: range.to });
  const del = useDeletePurchase();
  const { isOwner } = useAuth();
  const { push } = useToast();

  const total = purchases.data?.reduce((s, p) => s + Number(p.total_amount), 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Purchases"
        description="All money OUT for inventory."
        actions={
          <Link to="/purchases/new">
            <Button>
              <Plus size={14} /> New purchase
            </Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <DateRangePicker value={range} onChange={setRange} />
        <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm">
          <span className="text-secondary">
            {fmtDate(range.from)} – {fmtDate(range.to)}
          </span>
          <span className="font-mono tabular-nums">
            <span className="text-secondary">Total spent: </span>
            <span className="text-white">{fmtAED(total)}</span>
          </span>
        </div>
      </Card>

      <Card padded={false}>
        {purchases.isLoading ? (
          <div className="p-10 flex justify-center">
            <Spinner />
          </div>
        ) : !purchases.data || purchases.data.length === 0 ? (
          <EmptyState
            icon={<PackagePlus size={28} />}
            title="No purchases yet in this range"
            description="Record a purchase to start tracking inventory cost."
            action={
              <Link to="/purchases/new">
                <Button>
                  <Plus size={14} /> New purchase
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {purchases.data.map((p) => {
              const open = expanded[p.id];
              return (
                <div key={p.id}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate cursor-pointer"
                    onClick={() =>
                      setExpanded((s) => ({ ...s, [p.id]: !open }))
                    }
                  >
                    {open ? (
                      <ChevronDown size={14} className="text-secondary" />
                    ) : (
                      <ChevronRight size={14} className="text-secondary" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {p.supplier_name || "Walk-in supplier"}
                      </div>
                      <div className="text-xs text-secondary">
                        {fmtDate(p.purchase_date)} ·{" "}
                        <span className="capitalize">{p.payment_method}</span>{" "}
                        · {p.items.length} line
                        {p.items.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="font-mono tabular-nums text-sm text-white">
                      {fmtAED(p.total_amount)}
                    </div>
                    {isOwner && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("Delete this purchase? Stock will revert.")) return;
                          try {
                            await del.mutateAsync(p.id);
                            push("Purchase deleted");
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
                            <th>Serial / Notes</th>
                            <th className="text-right">Qty</th>
                            <th className="text-right">Unit cost</th>
                            <th className="text-right">Line total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.items.map((it) => (
                            <tr key={it.id}>
                              <td>{it.product?.name ?? "—"}</td>
                              <td className="text-secondary text-xs">
                                {it.unit?.serial_no || it.unit?.condition_notes
                                  ? [it.unit.serial_no, it.unit.condition_notes]
                                      .filter(Boolean)
                                      .join(" · ")
                                  : "—"}
                              </td>
                              <td className="text-right font-mono tabular-nums">
                                {it.quantity}
                              </td>
                              <td className="text-right font-mono tabular-nums">
                                {fmtAED(it.unit_cost)}
                              </td>
                              <td className="text-right font-mono tabular-nums">
                                {fmtAED(it.line_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {p.notes && (
                        <div className="text-xs text-secondary mt-2">
                          Notes: {p.notes}
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
