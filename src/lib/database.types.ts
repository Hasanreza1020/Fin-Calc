// Hand-written Supabase types matching the migrations in /supabase.
// Replace with `supabase gen types typescript` output later if you wish.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductCondition = "new" | "used";
export type TrackMode = "batch" | "per_unit";
export type UnitStatus = "in_stock" | "sold" | "reserved" | "returned";
export type Role = "owner" | "staff";
export type CategoryKind = "console" | "accessory" | "game" | "other";
export type ExpenseKind = "rent" | "utility" | "salary" | "supply" | "misc";
export type PaymentMethod = "cash" | "card" | "transfer" | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: Role;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: Role;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          kind: CategoryKind;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          kind?: CategoryKind;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          category_id: string | null;
          sku: string | null;
          condition: ProductCondition;
          track_mode: TrackMode;
          default_price: number;
          default_cost: number;
          current_stock: number;
          notes: string | null;
          archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_id?: string | null;
          sku?: string | null;
          condition?: ProductCondition;
          track_mode?: TrackMode;
          default_price?: number;
          default_cost?: number;
          current_stock?: number;
          notes?: string | null;
          archived?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      inventory_units: {
        Row: {
          id: string;
          product_id: string;
          serial_no: string | null;
          condition_notes: string | null;
          cost: number;
          status: UnitStatus;
          purchase_id: string | null;
          sale_id: string | null;
          acquired_at: string;
          sold_at: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          serial_no?: string | null;
          condition_notes?: string | null;
          cost?: number;
          status?: UnitStatus;
          purchase_id?: string | null;
          sale_id?: string | null;
          acquired_at?: string;
          sold_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["inventory_units"]["Insert"]
        >;
      };
      purchases: {
        Row: {
          id: string;
          supplier_name: string | null;
          purchase_date: string;
          total_amount: number;
          payment_method: PaymentMethod;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          supplier_name?: string | null;
          purchase_date?: string;
          total_amount?: number;
          payment_method?: PaymentMethod;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["purchases"]["Insert"]>;
      };
      purchase_items: {
        Row: {
          id: string;
          purchase_id: string;
          product_id: string;
          inventory_unit_id: string | null;
          quantity: number;
          unit_cost: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          purchase_id: string;
          product_id: string;
          inventory_unit_id?: string | null;
          quantity?: number;
          unit_cost?: number;
          line_total?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["purchase_items"]["Insert"]
        >;
      };
      sales: {
        Row: {
          id: string;
          customer_name: string | null;
          customer_id: string | null;
          sale_date: string;
          total_amount: number;
          payment_method: PaymentMethod;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name?: string | null;
          customer_id?: string | null;
          sale_date?: string;
          total_amount?: number;
          payment_method?: PaymentMethod;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sales"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
          total_spent: number;
          order_count: number;
          last_order_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          total_spent?: number;
          order_count?: number;
          last_order_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          inventory_unit_id: string | null;
          quantity: number;
          unit_price: number;
          unit_cost_at_sale: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          inventory_unit_id?: string | null;
          quantity?: number;
          unit_price?: number;
          unit_cost_at_sale?: number;
          line_total?: number;
        };
        Update: Partial<Database["public"]["Tables"]["sale_items"]["Insert"]>;
      };
      expenses: {
        Row: {
          id: string;
          category: ExpenseKind;
          amount: number;
          date: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category?: ExpenseKind;
          amount?: number;
          date?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
      };
      other_income: {
        Row: {
          id: string;
          source: string;
          amount: number;
          date: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          amount?: number;
          date?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["other_income"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
