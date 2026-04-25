import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useProduct } from "@/hooks/queries/useProducts";
import { useInventoryUnits } from "@/hooks/queries/useInventory";
import { fmtAED } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = useProduct(id);
  const units = useInventoryUnits({ productId: id });

  if (product.isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Spinner />
      </div>
    );
  }
  if (!product.data) {
    return (
      <div className="text-secondary">
        Product not found.{" "}
        <Link to="/products" className="text-white underline">
          Back
        </Link>
      </div>
    );
  }

  const p = product.data;

  return (
    <>
      <Link
        to="/products"
        className="text-xs text-secondary hover:text-white inline-flex items-center gap-1 mb-3"
      >
        <ArrowLeft size={12} /> Products
      </Link>

      <PageHeader
        title={p.name}
        description={`${p.condition.toUpperCase()} · ${
          p.track_mode === "per_unit" ? "Per-unit" : "Batch"
        } · ${p.category?.name ?? "Uncategorised"}`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Card title="SKU"><div className="font-mono text-sm">{p.sku ?? "—"}</div></Card>
        <Card title="Default sell">
          <div className="font-mono tabular-nums text-sm">
            {fmtAED(p.default_price)}
          </div>
        </Card>
        <Card title="Default cost">
          <div className="font-mono tabular-nums text-sm">
            {fmtAED(p.default_cost)}
          </div>
        </Card>
        <Card title="Stock">
          <div className="font-mono tabular-nums text-sm">
            {p.track_mode === "batch"
              ? p.current_stock
              : units.data?.filter((u) => u.status === "in_stock").length ?? 0}
          </div>
        </Card>
      </div>

      {p.notes && (
        <Card title="Notes" className="mb-5">
          <p className="text-sm text-white whitespace-pre-line">{p.notes}</p>
        </Card>
      )}

      {p.track_mode === "per_unit" && (
        <Card title="Inventory units" padded={false}>
          {units.isLoading ? (
            <div className="p-10 flex justify-center">
              <Spinner />
            </div>
          ) : units.data && units.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Serial</th>
                    <th>Condition</th>
                    <th className="text-right">Cost</th>
                    <th>Status</th>
                    <th>Acquired</th>
                    <th>Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {units.data.map((u) => (
                    <tr key={u.id}>
                      <td className="font-mono text-xs">
                        {u.serial_no ?? "—"}
                      </td>
                      <td className="text-secondary">
                        {u.condition_notes ?? "—"}
                      </td>
                      <td className="text-right font-mono tabular-nums">
                        {fmtAED(u.cost)}
                      </td>
                      <td>
                        <span
                          className={
                            u.status === "in_stock" ? "pill-on" : "pill"
                          }
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="text-secondary text-xs">
                        {fmtDateTime(u.acquired_at)}
                      </td>
                      <td className="text-secondary text-xs">
                        {u.sold_at ? fmtDateTime(u.sold_at) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-sm text-secondary">No units yet.</div>
          )}
        </Card>
      )}
    </>
  );
}
