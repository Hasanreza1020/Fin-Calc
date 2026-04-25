import { useMemo } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { useProducts } from "@/hooks/queries/useProducts";

type Props = {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  filter?: (p: {
    id: string;
    name: string;
    condition: string;
    track_mode: string;
  }) => boolean;
};

export function ProductPicker({ value, onChange, label = "Product", filter }: Props) {
  const products = useProducts();

  const options = useMemo(() => {
    const list = products.data ?? [];
    const filtered = filter ? list.filter(filter) : list;
    return filtered.map((p) => ({
      value: p.id,
      label: p.name,
      hint: `${p.condition} · ${p.track_mode === "per_unit" ? "per-unit" : "batch"}${
        p.sku ? ` · ${p.sku}` : ""
      }`,
    }));
  }, [products.data, filter]);

  return (
    <Combobox
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Search products…"
      emptyText="No products. Create one first."
    />
  );
}
