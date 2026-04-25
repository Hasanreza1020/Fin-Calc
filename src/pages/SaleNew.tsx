import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ProductPicker } from "@/components/forms/ProductPicker";
import { UnitPicker } from "@/components/forms/UnitPicker";
import { useProducts } from "@/hooks/queries/useProducts";
import { useCreateSale } from "@/hooks/queries/useSales";
import { useToast } from "@/components/ui/Toast";
import { fmtAED } from "@/lib/money";
import type { PaymentMethod } from "@/lib/database.types";

type Line = {
  uid: number;
  product_id: string | null;
  inventory_unit_id: string | null;
  unit_cost_at_sale: number;
  quantity: string;
  unit_price: string;
};

let nextUid = 1;
const empty = (): Line => ({
  uid: nextUid++,
  product_id: null,
  inventory_unit_id: null,
  unit_cost_at_sale: 0,
  quantity: "1",
  unit_price: "0",
});

export function SaleNew() {
  const navigate = useNavigate();
  const products = useProducts();
  const create = useCreateSale();
  const { push } = useToast();

  const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([empty()]);

  const productMap = useMemo(() => {
    const m = new Map<string, NonNullable<typeof products.data>[number]>();
    products.data?.forEach((p) => m.set(p.id, p));
    return m;
  }, [products.data]);

  const total = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
    0
  );

  function setLine(uid: number, patch: Partial<Line>) {
    setLines((arr) => arr.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));
  }

  async function submit() {
    const valid = lines.filter((l) => l.product_id);
    if (valid.length === 0) {
      push("Add at least one product line", "error");
      return;
    }
    // Ensure per-unit lines have a unit picked
    for (const l of valid) {
      const p = productMap.get(l.product_id!);
      if (p?.track_mode === "per_unit" && !l.inventory_unit_id) {
        push(`Pick a specific unit for "${p.name}"`, "error");
        return;
      }
    }

    const items = valid.map((l) => {
      const p = productMap.get(l.product_id!);
      const isPer = p?.track_mode === "per_unit";
      const qty = isPer ? 1 : Math.max(1, Number(l.quantity) || 1);
      const price = Math.max(0, Number(l.unit_price) || 0);
      const cost = isPer
        ? l.unit_cost_at_sale
        : Number(p?.default_cost ?? 0);
      return {
        product_id: l.product_id!,
        inventory_unit_id: l.inventory_unit_id,
        quantity: qty,
        unit_price: price,
        unit_cost_at_sale: cost,
        line_total: qty * price,
      };
    });

    try {
      await create.mutateAsync({
        sale: {
          customer_name: customer.trim() || null,
          payment_method: payment,
          notes: notes.trim() || null,
        },
        items,
      });
      push("Sale recorded");
      navigate("/sales");
    } catch (e: unknown) {
      push(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  return (
    <>
      <Link
        to="/sales"
        className="text-xs text-secondary hover:text-white inline-flex items-center gap-1 mb-3"
      >
        <ArrowLeft size={12} /> Sales
      </Link>
      <PageHeader title="New sale" description="Record cash IN from a sale." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card title="Header">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Customer (optional)"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Walk-in"
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
              <div className="sm:col-span-2">
                <Input
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card
            title="Items"
            actions={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setLines((a) => [...a, empty()])}
              >
                <Plus size={13} /> Add line
              </Button>
            }
          >
            <div className="space-y-3">
              {lines.map((l) => {
                const p = l.product_id ? productMap.get(l.product_id) : null;
                const isPer = p?.track_mode === "per_unit";
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
                            const np = id ? productMap.get(id) : null;
                            setLine(l.uid, {
                              product_id: id,
                              inventory_unit_id: null,
                              unit_cost_at_sale: 0,
                              unit_price:
                                np && Number(np.default_price) > 0
                                  ? String(np.default_price)
                                  : l.unit_price,
                              quantity:
                                np?.track_mode === "per_unit" ? "1" : l.quantity,
                            });
                          }}
                        />
                      </div>
                      <button
                        onClick={() =>
                          setLines((arr) =>
                            arr.length === 1
                              ? arr
                              : arr.filter((x) => x.uid !== l.uid)
                          )
                        }
                        className="btn-ghost px-2 py-2 mt-5"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {isPer && p && (
                      <UnitPicker
                        productId={p.id}
                        value={l.inventory_unit_id}
                        onChange={(unitId, cost) =>
                          setLine(l.uid, {
                            inventory_unit_id: unitId,
                            unit_cost_at_sale: cost ?? 0,
                          })
                        }
                      />
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Input
                        label="Qty"
                        type="number"
                        min={1}
                        step={1}
                        value={l.quantity}
                        disabled={isPer}
                        onChange={(e) =>
                          setLine(l.uid, { quantity: e.target.value })
                        }
                        hint={isPer ? "Locked at 1" : undefined}
                      />
                      <Input
                        label="Unit price (AED)"
                        type="number"
                        step="0.01"
                        min={0}
                        value={l.unit_price}
                        onChange={(e) =>
                          setLine(l.uid, { unit_price: e.target.value })
                        }
                      />
                      <div>
                        <label className="label">Line total</label>
                        <div className="input-base font-mono tabular-nums text-right">
                          {fmtAED(
                            (Number(l.quantity) || 0) *
                              (Number(l.unit_price) || 0)
                          )}
                        </div>
                      </div>
                    </div>

                    {isPer && l.unit_cost_at_sale > 0 && (
                      <div className="text-xs text-secondary">
                        Locked cost at sale: {fmtAED(l.unit_cost_at_sale)} ·
                        Margin:{" "}
                        <span className="text-white font-mono">
                          {fmtAED(
                            (Number(l.unit_price) || 0) - l.unit_cost_at_sale
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
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
                Save sale
              </Button>
              <Button variant="ghost" onClick={() => navigate("/sales")}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
