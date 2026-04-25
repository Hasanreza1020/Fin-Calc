import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type Income = Database["public"]["Tables"]["other_income"]["Row"];
type IncomeInsert = Database["public"]["Tables"]["other_income"]["Insert"];

export function useExpenses(opts?: { from?: Date; to?: Date }) {
  return useQuery({
    queryKey: ["expenses", opts],
    queryFn: async (): Promise<Expense[]> => {
      let q = supabase.from("expenses").select("*").order("date", {
        ascending: false,
      });
      if (opts?.from) q = q.gte("date", opts.from.toISOString().slice(0, 10));
      if (opts?.to) q = q.lte("date", opts.to.toISOString().slice(0, 10));
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOtherIncome(opts?: { from?: Date; to?: Date }) {
  return useQuery({
    queryKey: ["other_income", opts],
    queryFn: async (): Promise<Income[]> => {
      let q = supabase.from("other_income").select("*").order("date", {
        ascending: false,
      });
      if (opts?.from) q = q.gte("date", opts.from.toISOString().slice(0, 10));
      if (opts?.to) q = q.lte("date", opts.to.toISOString().slice(0, 10));
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExpenseInsert) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useCreateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: IncomeInsert) => {
      const { data, error } = await supabase
        .from("other_income")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["other_income"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useDeleteIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("other_income")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["other_income"] }),
  });
}
