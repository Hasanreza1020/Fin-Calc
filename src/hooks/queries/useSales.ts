import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Sale = Database["public"]["Tables"]["sales"]["Row"];
type SaleInsert = Database["public"]["Tables"]["sales"]["Insert"];
type SaleItemInsert = Database["public"]["Tables"]["sale_items"]["Insert"];

export type SaleWithItems = Sale & {
  items: (Database["public"]["Tables"]["sale_items"]["Row"] & {
    product: { id: string; name: string; sku: string | null } | null;
  })[];
};

export function useSales(opts?: { from?: Date; to?: Date; limit?: number }) {
  return useQuery({
    queryKey: ["sales", opts],
    queryFn: async (): Promise<SaleWithItems[]> => {
      let q = supabase
        .from("sales")
        .select(
          "*, items:sale_items(*, product:products(id,name,sku))"
        )
        .order("sale_date", { ascending: false });
      if (opts?.from) q = q.gte("sale_date", opts.from.toISOString());
      if (opts?.to) q = q.lte("sale_date", opts.to.toISOString());
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SaleWithItems[];
    },
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sale: SaleInsert;
      items: Omit<SaleItemInsert, "sale_id">[];
    }) => {
      const { data: sale, error } = await supabase
        .from("sales")
        .insert(input.sale)
        .select()
        .single();
      if (error) throw error;
      if (input.items.length > 0) {
        const rows = input.items.map((it) => ({ ...it, sale_id: sale.id }));
        const { error: e2 } = await supabase.from("sale_items").insert(rows);
        if (e2) throw e2;
      }
      return sale;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["inventory_units"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["inventory_units"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
