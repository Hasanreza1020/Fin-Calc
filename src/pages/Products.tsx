import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Package, Tag, Archive, ArchiveRestore, Pencil, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ProductForm } from "@/components/forms/ProductForm";
import { CategoryForm } from "@/components/forms/CategoryForm";
import {
  useArchiveProduct,
  useProducts,
  type ProductWithCategory,
} from "@/hooks/queries/useProducts";
import { useCategories } from "@/hooks/queries/useCategories";
import { fmtAED } from "@/lib/money";
import { useToast } from "@/components/ui/Toast";

export function Products() {
  const [showProduct, setShowProduct] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [search, setSearch] = useState("");
  const products = useProducts({ includeArchived });
  const cats = useCategories();
  const archive = useArchiveProduct();
  const { push } = useToast();

  const filtered = useMemo(() => {
    if (!products.data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return products.data;
    return products.data.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
    );
  }, [products.data, search]);

  return (
    <>
      <PageHeader
        title="Products"
        description="Catalog of items you buy and sell."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowCategory(true)}>
              <Tag size={14} /> New category
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setShowProduct(true);
              }}
            >
              <Plus size={14} /> New product
            </Button>
          </>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, SKU, category…"
            className="input-base pl-8"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-secondary">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="accent-white"
          />
          Show archived
        </label>
      </div>

      <Card padded={false}>
        {products.isLoading ? (
          <div className="p-10 flex justify-center">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="No products yet"
            description="Create your first product to start tracking buys and sells."
            action={
              <Button onClick={() => setShowProduct(true)}>
                <Plus size={14} /> New product
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Cond.</th>
                  <th>Mode</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Sell @</th>
                  <th className="text-right">Cost @</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className={p.archived ? "opacity-50" : ""}>
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
                    <td>
                      <span className="pill">{p.condition}</span>
                    </td>
                    <td>
                      <span className="pill">
                        {p.track_mode === "per_unit" ? "per-unit" : "batch"}
                      </span>
                    </td>
                    <td className="text-right font-mono tabular-nums">
                      {p.track_mode === "batch" ? p.current_stock : "—"}
                    </td>
                    <td className="text-right font-mono tabular-nums">
                      {fmtAED(p.default_price)}
                    </td>
                    <td className="text-right font-mono tabular-nums text-secondary">
                      {fmtAED(p.default_cost)}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        className="btn-ghost px-2 py-1"
                        onClick={() => {
                          setEditing(p);
                          setShowProduct(true);
                        }}
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn-ghost px-2 py-1"
                        title={p.archived ? "Restore" : "Archive"}
                        onClick={async () => {
                          try {
                            await archive.mutateAsync({
                              id: p.id,
                              archived: !p.archived,
                            });
                            push(p.archived ? "Restored" : "Archived");
                          } catch (e: unknown) {
                            push(
                              e instanceof Error ? e.message : "Failed",
                              "error"
                            );
                          }
                        }}
                      >
                        {p.archived ? (
                          <ArchiveRestore size={13} />
                        ) : (
                          <Archive size={13} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-6 text-xs text-secondary">
        {cats.data?.length ?? 0} categories · {products.data?.length ?? 0}{" "}
        products
      </div>

      <ProductForm
        open={showProduct}
        onClose={() => setShowProduct(false)}
        product={editing}
      />
      <CategoryForm open={showCategory} onClose={() => setShowCategory(false)} />
    </>
  );
}
