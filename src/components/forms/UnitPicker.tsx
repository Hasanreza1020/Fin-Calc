import { useMemo } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { useInventoryUnits } from "@/hooks/queries/useInventory";

type Props = {
  productId: string;
  value: string | null;
  onChange: (unitId: string | null, cost: number | null) => void;
};

export function UnitPicker({ productId, value, onChange }: Props) {
  const units = useInventoryUnits({ productId, status: "in_stock" });

  const options = useMemo(
    () =>
      (units.data ?? []).map((u) => ({
        value: u.id,
        label: u.serial_no || `Unit ${u.id.slice(0, 6)}`,
        hint: u.condition_notes ?? undefined,
      })),
    [units.data]
  );

  return (
    <Combobox
      label="Specific unit"
      value={value}
      onChange={(id) => {
        const u = units.data?.find((x) => x.id === id) ?? null;
        onChange(id, u ? Number(u.cost) : null);
      }}
      options={options}
      placeholder="Pick a unit in stock…"
      emptyText="No in-stock units for this product."
    />
  );
}
