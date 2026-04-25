import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ProductPicker } from "@/components/forms/ProductPicker";
import { useProducts } from "@/hooks/queries/useProducts";
import { useCreatePurchase } from "@/hooks/queries/usePurchases";
import { useToast } from "@/components/ui/Toast";
import { fmtAED } from "@/lib/money";
import { toISODate } from "@/lib/dates";
import type { PaymentMethod } from "@/lib/database.types";

type Line = {
  uid: number;
  product_id: string | null;
  quantity: string;
  unit_cost: string;
  // per-unit line
  serial_no?: string;
  condition_notes?: string;
};

let nextUid = 1;

function emptyLine(): Line {
  return {
    uid: nextUid++,
    product_id: null,
    quantity: "1",
    unit_cost: "0",
  };
}

export function PurchaseNew() {
  const navigate = useNavigate();
  const products = useProducts();
  const create = useCreatePurchase();
  const { push } = useToast();

  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  const productMap = useMemo(() => {
    const m = new Map<string, NonNullable<typeof products.data>[number]>();
    products.data?.forEach((p) => m.set(p.id, p));
    return m;
  }, [products.data]);

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0),
    0
  );

  function setLine(uid: number, patch: Partial<Line>) {
    setLines((arr) => arr.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));
  }
  function removeLine(uid: number) {
    setLines((arr) => (arr.length === 1 ? arr : arr.filter((l) => l.uid !== uid)));
  }

  async function submit() {
    const validLines = lines.filter((l) => l.product_id);
    if (validLines.length === 0) {
      push("Add at least one product line", "error");
      return;
    }

    const items = validLines.map((l) => {
      const product = productMap.get(l.product_id!);
      const isPerUnit = product?.track_mode === "per_unit";
      const qty = isPerUnit ? 1 : Math.max(1, Number(l.quantity) || 1);
      const unitCost = Math.max(0, Number(l.unit_cost) || 0);
      return {
        product_id: l.product_id!,
        quantity: qty,
        unit_cost: unitCost,
        line_total: qty * unitCost,
        ...(isPerUnit && {
          unit: {
            cost: unitCost,
            serial_no: l.serial_no?.trim() || null,
            condition_notes: l.condition_notes?.trim() || null,
          },
        }),
      };
    });

    try {
      await create.mutateAsync({
        purchase: {
          supplier_name: supplier.trim() || null,
          purchase_date: date,
          payment_method: payment,
          notes: notes.trim() || null,
        },
        items,
      });
      push("Purchase recorded");
      navigate("/purchases");
    } catch (e: unknown) {
      push(e instanceof Error ? e.message : "Failed to save", "error");
    }
  }

  return (
    <>
      <Link
        to="/purchases"
        className="text-xs text-secondary hover:text-white inline-flex items-center gap-1 mb-3"
      >
        <ArrowLeft size={12} /> Purchases
      </Link>
      <PageHeader
        title="New purchase"
        description="Record stock you bought (cash OUT)."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card title="Header">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Supplier (optional)"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Walk-in / Marketplace user / Distributor"
              />
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Select
                label="Payment"
                value={payment}
                onChange={(e) => setPayment(e.target.value as PaymentMethod)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Bank transfer</option>
                <option value="other">Other</option>
              </Select>
              <Input
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </Card>

          <Card
            title="Items"
            actions={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setLines((a) => [...a, emptyLine()])}
              >
                <Plus size={13} /> Add line
              </Button>
            }
          >
            <div className="space-y-3">
              {lines.map((l) => {
                const product = l.product_id
                  ? productMap.get(l.product_id)
                  : null;
                const isPerUnit = product?.track_mode === "per_unit";
                return (
                  <div
                    key={l.uid}
                    className="border border-border rounded-lg p-3 space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <ProductPicker
                          value={l.product_id}
                          onChange={(id) => {
                            const p = id ? productMap.get(id) : null;
                            setLine(l.uid, {
                              product_id: id,
                              unit_cost:
                                p && Number(p.default_cost) > 0
                                  ? String(p.default_cost)
                                  : l.unit_cost,
                              quantity:
                                p?.track_mode === "per_unit" ? "1" : l.quantity,
                            });
                          }}
                        />
                      </div>
                      <button
                        onClick={() => removeLine(l.uid)}
                        className="btn-ghost px-2 py-2 mt-5"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Input
                        label="Qty"
                        type="number"
                        min={1}
                        step={1}
                        value={l.quantity}
                        disabled={isPerUnit}
                        onChange={(e) =>
                          setLine(l.uid, { quantity: e.target.value })
                        }
                        hint={isPerUnit ? "Locked at 1 (per-unit)" : undefined}
                      />
                      <Input
                        label="Unit cost (AED)"
                        type="number"
                        step="0.01"
                        min={0}
                        value={l.unit_cost}
                        onChange={(e) =>
                          setLine(l.uid, { unit_cost: e.target.value })
                        }
                      />
                      <div>
                        <label className="label">Line total</label>
                        <div className="input-base font-mono tabular-nums text-right">
                          {fmtAED(
                            (Number(l.quantity) || 0) *
                              (Number(l.unit_cost) || 0)
                          )}
                        </div>
                      </div>
                    </div>

                    {isPerUnit && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Serial / ID (optional)"
                          value={l.serial_no ?? ""}
                          onChange={(e) =>
                            setLine(l.uid, { serial_no: e.target.value })
                          }
                          placeholder="e.g. CFI-2016A 12345"
                        />
                        <Input
                          label="Condition notes"
                          value={l.condition_notes ?? ""}
                          onChange={(e) =>
                            setLine(l.uid, {
                              condition_notes: e.target.value,
                            })
                          }
                          placeholder="Scratches on top, all buttons OK"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Summary">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-secondary">
                <span>Lines</span>
                <span>{lines.filter((l) => l.product_id).length}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-white">Total</span>
                <span className="font-mono tabular-nums text-white text-base">
                  {fmtAED(total)}
                </span>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button onClick={submit} disabled={create.isPending}>
                Save purchase
              </Button>
              <Button variant="ghost" onClick={() => navigate("/purchases")}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
