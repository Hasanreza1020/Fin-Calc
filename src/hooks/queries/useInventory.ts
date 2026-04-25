import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Unit = Database["public"]["Tables"]["inventory_units"]["Row"];
type UnitInsert = Database["public"]["Tables"]["inventory_units"]["Insert"];

export type UnitWithProduct = Unit & {
  product: { id: string; name: string; sku: string | null } | null;
};

export function useInventoryUnits(opts?: {
  productId?: string;
  status?: Unit["status"];
}) {
  return useQuery({
    queryKey: ["inventory_units", opts],
    queryFn: async (): Promise<UnitWithProduct[]> => {
      let q = supabase
        .from("inventory_units")
        .select("*, product:products(id,name,sku)")
        .order("acquired_at", { ascending: false });
      if (opts?.productId) q = q.eq("product_id", opts.productId);
      if (opts?.status) q = q.eq("status", opts.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as UnitWithProduct[];
    },
  });
}

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UnitInsert) => {
      const { data, error } = await supabase
        .from("inventory_units")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory_units"] }),
  });
}
