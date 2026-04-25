import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProducts } from "@/hooks/queries/useProducts";
import { useInventoryUnits } from "@/hooks/queries/useInventory";
import { fmtAED } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
import { Input } from "@/components/ui/Input";

const LOW_STOCK_THRESHOLD = 2;

export function Inventory() {
  const products = useProducts();
  const units = useInventoryUnits({ status: "in_stock" });
  const [tab, setTab] = useState<"batch" | "perUnit">("batch");
  const [q, setQ] = useState("");

  const batchProducts = useMemo(
    () => (products.data ?? []).filter((p) => p.track_mode === "batch"),
    [products.data]
  );
  const perUnitProducts = useMemo(
    () => (products.data ?? []).filter((p) => p.track_mode === "per_unit"),
    [products.data]
  );

  const totalStockValue =
    batchProducts.reduce(
      (s, p) => s + Number(p.current_stock) * Number(p.default_cost),
      0
    ) +
    (units.data ?? []).reduce((s, u) => s + Number(u.cost), 0);

  const lowStock = batchProducts.filter(
    (p) => Number(p.current_stock) <= LOW_STOCK_THRESHOLD
  );

  const filteredBatch = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return batchProducts;
    return batchProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        p.sku?.toLowerCase().includes(t) ||
        p.category?.name?.toLowerCase().includes(t)
    );
  }, [batchProducts, q]);

  const filteredUnits = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = units.data ?? [];
    if (!t) return list;
    return list.filter(
      (u) =>
        u.product?.name?.toLowerCase().includes(t) ||
        u.serial_no?.toLowerCase().includes(t) ||
        u.condition_notes?.toLowerCase().includes(t)
    );
  }, [units.data, q]);

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock currently in your shop."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card title="Stock value">
          <div className="font-mono tabular-nums text-lg">
            {fmtAED(totalStockValue)}
          </div>
        </Card>
        <Card title="Batch SKUs">
          <div className="font-mono tabular-nums text-lg">
            {batchProducts.length}
          </div>
        </Card>
        <Card title="Units (per-unit)">
          <div className="font-mono tabular-nums text-lg">
            {units.data?.length ?? 0}
          </div>
        </Card>
        <Card title="Low stock">
          <div className="font-mono tabular-nums text-lg flex items-center gap-1">
            {lowStock.length > 0 && (
              <AlertTriangle size={14} className="text-white" />
            )}
            {lowStock.length}
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab("batch")}
            className={tab === "batch" ? "pill-on" : "pill"}
          >
            Batch
          </button>
          <button
            onClick={() => setTab("perUnit")}
            className={tab === "perUnit" ? "pill-on" : "pill"}
          >
            Per-unit
          </button>
        </div>
        <div className="flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
          />
        </div>
      </div>

      <Card padded={false}>
        {tab === "batch" ? (
          products.isLoading ? (
            <div className="p-10 flex justify-center">
              <Spinner />
            </div>
          ) : filteredBatch.length === 0 ? (
            <EmptyState icon={<Boxes size={28} />} title="No batch stock" />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Cost @</th>
                  <th className="text-right">Stock value</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatch.map((p) => {
                  const value = Number(p.current_stock) * Number(p.default_cost);
                  const low = Number(p.current_stock) <= LOW_STOCK_THRESHOLD;
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link
                          to={`/products/${p.id}`}
                          className="text-white hover:underline"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="font-mono text-xs text-secondary">
                        {p.sku ?? "—"}
                      </td>
                      <td className="text-secondary">{p.category?.name ?? "—"}</td>
                      <td className="text-right font-mono tabular-nums">
                        <span className={low ? "text-white" : ""}>
                          {p.current_stock}
                        </span>
                        {low && (
                          <AlertTriangle
                            size={12}
                            className="inline ml-1 -mt-0.5"
                          />
                        )}
                      </td>
                      <td className="text-right font-mono tabular-nums text-secondary">
                        {fmtAED(p.default_cost)}
                      </td>
                      <td className="text-right font-mono tabular-nums">
                        {fmtAED(value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : units.isLoading ? (
          <div className="p-10 flex justify-center">
            <Spinner />
          </div>
        ) : filteredUnits.length === 0 ? (
          <EmptyState
            icon={<Boxes size={28} />}
            title="No per-unit items in stock"
          />
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Product</th>
                <th>Serial</th>
                <th>Condition</th>
                <th className="text-right">Cost</th>
                <th>Acquired</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.product ? (
                      <Link
                        to={`/products/${u.product.id}`}
                        className="text-white hover:underline"
                      >
                        {u.product.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="font-mono text-xs">{u.serial_no ?? "—"}</td>
                  <td className="text-secondary">
                    {u.condition_notes ?? "—"}
                  </td>
                  <td className="text-right font-mono tabular-nums">
                    {fmtAED(u.cost)}
                  </td>
                  <td className="text-secondary text-xs">
                    {fmtDateTime(u.acquired_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
