import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  useCreateProduct,
  useUpdateProduct,
  type ProductWithCategory,
} from "@/hooks/queries/useProducts";
import { useCategories } from "@/hooks/queries/useCategories";
import { useToast } from "@/components/ui/Toast";

type Props = {
  open: boolean;
  onClose: () => void;
  product?: ProductWithCategory | null;
};

export function ProductForm({ open, onClose, product }: Props) {
  const cats = useCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const { push } = useToast();
  const editing = !!product;

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [condition, setCondition] = useState<"new" | "used">("new");
  const [trackMode, setTrackMode] = useState<"batch" | "per_unit">("batch");
  const [defaultPrice, setDefaultPrice] = useState("0");
  const [defaultCost, setDefaultCost] = useState("0");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setName(product?.name ?? "");
      setSku(product?.sku ?? "");
      setCategoryId(product?.category_id ?? "");
      setCondition(product?.condition ?? "new");
      setTrackMode(product?.track_mode ?? "batch");
      setDefaultPrice(String(product?.default_price ?? 0));
      setDefaultCost(String(product?.default_cost ?? 0));
      setNotes(product?.notes ?? "");
    }
  }, [open, product]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      sku: sku.trim() || null,
      category_id: categoryId || null,
      condition,
      track_mode: trackMode,
      default_price: Number(defaultPrice) || 0,
      default_cost: Number(defaultCost) || 0,
      notes: notes.trim() || null,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: product!.id, patch: payload });
        push("Product updated");
      } else {
        await create.mutateAsync(payload);
        push("Product created");
      }
      onClose();
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "Failed to save";
      push(m, "error");
    }
  }

  const busy = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit product" : "New product"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !name.trim()}>
            {editing ? "Save" : "Create"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. PS5 Slim Disc Edition"
            required
          />
        </div>
        <Input
          label="SKU (optional)"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="PS5-SLIM-DISC"
        />
        <Select
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">— None —</option>
          {cats.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          label="Condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value as "new" | "used")}
        >
          <option value="new">New</option>
          <option value="used">Used / second-hand</option>
        </Select>
        <Select
          label="Tracking mode"
          value={trackMode}
          onChange={(e) =>
            setTrackMode(e.target.value as "batch" | "per_unit")
          }
          hint={
            trackMode === "per_unit"
              ? "Each unit logged with its own serial / condition / cost. Best for used items."
              : "Track only quantity in stock. Best for new bulk inventory."
          }
        >
          <option value="batch">Batch (count only)</option>
          <option value="per_unit">Per-unit (individual records)</option>
        </Select>
        <Input
          label="Default sell price (AED)"
          type="number"
          step="0.01"
          min={0}
          value={defaultPrice}
          onChange={(e) => setDefaultPrice(e.target.value)}
        />
        <Input
          label="Default cost (AED)"
          type="number"
          step="0.01"
          min={0}
          value={defaultCost}
          onChange={(e) => setDefaultCost(e.target.value)}
        />
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-base min-h-[64px]"
            rows={2}
          />
        </div>
      </form>
    </Modal>
  );
}
