import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  bucketKey,
  bucketLabel,
  type DateRange,
  type Granularity,
} from "@/lib/dates";

export type ReportRow = {
  bucket: string;
  label: string;
  revenue: number;
  cost: number;
  expenses: number;
  otherIncome: number;
  profit: number;
  net: number;
};

type SaleItem = {
  quantity: number;
  unit_price: number;
  unit_cost_at_sale: number;
};
type SaleRecord = {
  sale_date: string;
  total_amount: number;
  items: SaleItem[] | null;
  product?: { name: string; category: { id: string; name: string } | null } | null;
};

export function useReportData(range: DateRange, granularity: Granularity) {
  return useQuery({
    queryKey: ["reports", "main", range.from.toISOString(), range.to.toISOString(), granularity],
    queryFn: async () => {
      const fromIso = range.from.toISOString();
      const toIso = range.to.toISOString();
      const fromDate = fromIso.slice(0, 10);
      const toDate = toIso.slice(0, 10);

      const [salesRes, expensesRes, incomeRes] = await Promise.all([
        supabase
          .from("sales")
          .select(
            "sale_date, total_amount, items:sale_items(quantity, unit_price, unit_cost_at_sale)"
          )
          .gte("sale_date", fromIso)
          .lte("sale_date", toIso),
        supabase
          .from("expenses")
          .select("date, amount, category")
          .gte("date", fromDate)
          .lte("date", toDate),
        supabase
          .from("other_income")
          .select("date, amount, source")
          .gte("date", fromDate)
          .lte("date", toDate),
      ]);
      if (salesRes.error) throw salesRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (incomeRes.error) throw incomeRes.error;

      // Bucket aggregation
      const buckets = new Map<string, ReportRow>();
      function ensure(key: string): ReportRow {
        let r = buckets.get(key);
        if (!r) {
          r = {
            bucket: key,
            label: bucketLabel(key, granularity),
            revenue: 0,
            cost: 0,
            expenses: 0,
            otherIncome: 0,
            profit: 0,
            net: 0,
          };
          buckets.set(key, r);
        }
        return r;
      }

      for (const s of (salesRes.data ?? []) as SaleRecord[]) {
        const k = bucketKey(new Date(s.sale_date), granularity);
        const row = ensure(k);
        const cost = (s.items ?? []).reduce(
          (t, it) => t + Number(it.unit_cost_at_sale) * Number(it.quantity),
          0
        );
        row.revenue += Number(s.total_amount);
        row.cost += cost;
      }

      for (const e of expensesRes.data ?? []) {
        const k = bucketKey(new Date(e.date), granularity);
        ensure(k).expenses += Number(e.amount);
      }
      for (const i of incomeRes.data ?? []) {
        const k = bucketKey(new Date(i.date), granularity);
        ensure(k).otherIncome += Number(i.amount);
      }

      const rows = Array.from(buckets.values()).sort((a, b) =>
        a.bucket < b.bucket ? -1 : 1
      );
      for (const r of rows) {
        r.profit = r.revenue - r.cost - r.expenses + r.otherIncome;
        r.net = r.revenue + r.otherIncome - r.expenses;
      }

      return {
        rows,
        totals: rows.reduce(
          (acc, r) => ({
            revenue: acc.revenue + r.revenue,
            cost: acc.cost + r.cost,
            expenses: acc.expenses + r.expenses,
            otherIncome: acc.otherIncome + r.otherIncome,
            profit: acc.profit + r.profit,
            net: acc.net + r.net,
          }),
          {
            revenue: 0,
            cost: 0,
            expenses: 0,
            otherIncome: 0,
            profit: 0,
            net: 0,
          }
        ),
      };
    },
  });
}

// Top products & profit by category
export function useProductBreakdown(range: DateRange) {
  return useQuery({
    queryKey: [
      "reports",
      "products",
      range.from.toISOString(),
      range.to.toISOString(),
    ],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_items")
        .select(
          "quantity, unit_price, unit_cost_at_sale, line_total, sales!inner(sale_date), product:products(id, name, category:categories(id, name))"
        )
        .gte("sales.sale_date", range.from.toISOString())
        .lte("sales.sale_date", range.to.toISOString());
      if (error) throw error;

      type ProductAgg = {
        id: string;
        name: string;
        qty: number;
        revenue: number;
        cost: number;
        profit: number;
        margin: number;
      };
      type CatAgg = {
        id: string;
        name: string;
        revenue: number;
        profit: number;
      };

      const products = new Map<string, ProductAgg>();
      const cats = new Map<string, CatAgg>();

      for (const r of data ?? []) {
        const p = (r as unknown as { product: { id: string; name: string; category: { id: string; name: string } | null } | null }).product;
        if (!p) continue;
        const qty = Number(r.quantity);
        const rev = Number(r.line_total);
        const cost = Number(r.unit_cost_at_sale) * qty;
        const profit = rev - cost;

        const pa = products.get(p.id) ?? {
          id: p.id,
          name: p.name,
          qty: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          margin: 0,
        };
        pa.qty += qty;
        pa.revenue += rev;
        pa.cost += cost;
        pa.profit += profit;
        pa.margin = pa.revenue > 0 ? pa.profit / pa.revenue : 0;
        products.set(p.id, pa);

        const cat = p.category;
        const catId = cat?.id ?? "_uncat";
        const catName = cat?.name ?? "Uncategorised";
        const ca = cats.get(catId) ?? {
          id: catId,
          name: catName,
          revenue: 0,
          profit: 0,
        };
        ca.revenue += rev;
        ca.profit += profit;
        cats.set(catId, ca);
      }

      return {
        products: Array.from(products.values()).sort(
          (a, b) => b.revenue - a.revenue
        ),
        categories: Array.from(cats.values()).sort(
          (a, b) => b.profit - a.profit
        ),
      };
    },
  });
}

// Sales heatmap data: day-of-week × hour-of-day
export function useSalesHeatmap(range: DateRange) {
  return useQuery({
    queryKey: [
      "reports",
      "heatmap",
      range.from.toISOString(),
      range.to.toISOString(),
    ],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("sale_date, total_amount")
        .gte("sale_date", range.from.toISOString())
        .lte("sale_date", range.to.toISOString());
      if (error) throw error;
      const cells: { row: number; col: number; value: number }[] = [];
      const grid: number[][] = Array.from({ length: 7 }, () =>
        Array(24).fill(0)
      );
      for (const s of data ?? []) {
        const d = new Date(s.sale_date);
        const row = (d.getDay() + 6) % 7; // Monday=0
        const col = d.getHours();
        grid[row][col] += Number(s.total_amount);
      }
      grid.forEach((row, ri) =>
        row.forEach((v, ci) => {
          if (v > 0) cells.push({ row: ri, col: ci, value: v });
        })
      );
      return cells;
    },
  });
}

// Expense breakdown by category
export function useExpenseBreakdown(range: DateRange) {
  return useQuery({
    queryKey: [
      "reports",
      "expense-breakdown",
      range.from.toISOString(),
      range.to.toISOString(),
    ],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("category, amount")
        .gte("date", range.from.toISOString().slice(0, 10))
        .lte("date", range.to.toISOString().slice(0, 10));
      if (error) throw error;
      const m = new Map<string, number>();
      for (const e of data ?? [])
        m.set(e.category, (m.get(e.category) ?? 0) + Number(e.amount));
      return Array.from(m.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
    },
  });
}
