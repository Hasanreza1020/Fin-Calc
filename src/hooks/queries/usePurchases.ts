import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
type PurchaseInsert = Database["public"]["Tables"]["purchases"]["Insert"];
type PurchaseItemInsert = Database["public"]["Tables"]["purchase_items"]["Insert"];
type UnitInsert = Database["public"]["Tables"]["inventory_units"]["Insert"];

export type PurchaseWithItems = Purchase & {
  items: (Database["public"]["Tables"]["purchase_items"]["Row"] & {
    product: { id: string; name: string; sku: string | null } | null;
    unit: {
      id: string;
      serial_no: string | null;
      condition_notes: string | null;
    } | null;
  })[];
};

export function usePurchases(opts?: { from?: Date; to?: Date; limit?: number }) {
  return useQuery({
    queryKey: ["purchases", opts],
    queryFn: async (): Promise<PurchaseWithItems[]> => {
      let q = supabase
        .from("purchases")
        .select(
          "*, items:purchase_items(*, product:products(id,name,sku), unit:inventory_units(id,serial_no,condition_notes))"
        )
        .order("purchase_date", { ascending: false });
      if (opts?.from)
        q = q.gte("purchase_date", opts.from.toISOString().slice(0, 10));
      if (opts?.to)
        q = q.lte("purchase_date", opts.to.toISOString().slice(0, 10));
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PurchaseWithItems[];
    },
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      purchase: PurchaseInsert;
      items: (Omit<PurchaseItemInsert, "purchase_id" | "inventory_unit_id"> & {
        // For per-unit lines: build a unit row with serial / condition / cost
        unit?: Omit<UnitInsert, "product_id" | "purchase_id">;
      })[];
    }) => {
      const { data: purchase, error } = await supabase
        .from("purchases")
        .insert(input.purchase)
        .select()
        .single();
      if (error) throw error;

      const lineInserts: PurchaseItemInsert[] = [];
      for (const it of input.items) {
        let unitId: string | null = null;
        if (it.unit) {
          const { data: u, error: ue } = await supabase
            .from("inventory_units")
            .insert({
              product_id: it.product_id,
              purchase_id: purchase.id,
              cost: it.unit.cost ?? it.unit_cost ?? 0,
              serial_no: it.unit.serial_no ?? null,
              condition_notes: it.unit.condition_notes ?? null,
              status: "in_stock",
            })
            .select()
            .single();
          if (ue) throw ue;
          unitId = u.id;
        }
        lineInserts.push({
          purchase_id: purchase.id,
          product_id: it.product_id,
          inventory_unit_id: unitId,
          quantity: it.quantity ?? 1,
          unit_cost: it.unit_cost ?? 0,
          line_total:
            it.line_total ?? (it.unit_cost ?? 0) * (it.quantity ?? 1),
        });
      }

      if (lineInserts.length > 0) {
        const { error: e2 } = await supabase
          .from("purchase_items")
          .insert(lineInserts);
        if (e2) throw e2;
      }
      return purchase;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["inventory_units"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeletePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("purchases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["inventory_units"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
