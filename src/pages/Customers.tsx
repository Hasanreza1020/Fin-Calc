import { useMemo, useState } from "react";
import { Plus, Users, Download, Pencil, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { CustomerForm } from "@/components/forms/CustomerForm";
import {
  useCustomers,
  useDeleteCustomer,
  type Customer,
} from "@/hooks/queries/useCustomers";
import { fmtAED } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { toCSV, downloadCSV } from "@/lib/csv";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

export function Customers() {
  const [search, setSearch] = useState("");
  const customers = useCustomers({ search });
  const del = useDeleteCustomer();
  const { isOwner } = useAuth();
  const { push } = useToast();

  const [editing, setEditing] = useState<Customer | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const totals = useMemo(() => {
    const list = customers.data ?? [];
    return {
      count: list.length,
      revenue: list.reduce((s, c) => s + Number(c.total_spent), 0),
      orders: list.reduce((s, c) => s + Number(c.order_count), 0),
    };
  }, [customers.data]);

  function exportCSV() {
    const list = customers.data ?? [];
    if (list.length === 0) {
      push("Nothing to export", "error");
      return;
    }
    const rows = list.map((c) => ({
      name: c.name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      orders: c.order_count,
      total_spent_aed: c.total_spent,
      last_order: c.last_order_at ? fmtDate(c.last_order_at) : "",
      added: fmtDate(c.created_at),
      notes: c.notes ?? "",
    }));
    const csv = toCSV(rows);
    downloadCSV(`customers_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Names, contacts, and lifetime spend for everyone you've sold to."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportCSV}>
              <Download size={14} /> CSV
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setOpenForm(true);
              }}
            >
              <Plus size={14} /> New customer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <Card>
          <div className="text-xs text-secondary uppercase tracking-wider">
            Customers
          </div>
          <div className="text-xl text-white font-mono tabular-nums mt-1">
            {totals.count}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-secondary uppercase tracking-wider">
            Total orders
          </div>
          <div className="text-xl text-white font-mono tabular-nums mt-1">
            {totals.orders}
          </div>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <div className="text-xs text-secondary uppercase tracking-wider">
            Lifetime revenue
          </div>
          <div className="text-xl text-white font-mono tabular-nums mt-1">
            {fmtAED(totals.revenue)}
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or email"
            className="pl-8"
          />
        </div>
      </Card>

      <Card padded={false}>
        {customers.isLoading ? (
          <div className="p-10 flex justify-center">
            <Spinner />
          </div>
        ) : !customers.data || customers.data.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title={search ? "No matches" : "No customers yet"}
            description={
              search
                ? "Try a different search."
                : "Add a customer or attach one when recording a sale — they'll appear here."
            }
            action={
              !search && (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setOpenForm(true);
                  }}
                >
                  <Plus size={14} /> New customer
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th className="text-right">Orders</th>
                  <th className="text-right">Total spent</th>
                  <th>Last order</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.data.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="text-white">{c.name}</div>
                      {c.address && (
                        <div className="text-xs text-secondary">{c.address}</div>
                      )}
                    </td>
                    <td>
                      <div className="text-xs text-white">{c.phone || "—"}</div>
                      <div className="text-xs text-secondary">{c.email || ""}</div>
                    </td>
                    <td className="text-right font-mono tabular-nums">
                      {c.order_count}
                    </td>
                    <td className="text-right font-mono tabular-nums">
                      {fmtAED(c.total_spent)}
                    </td>
                    <td className="text-secondary">
                      {c.last_order_at ? fmtDate(c.last_order_at) : "—"}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditing(c);
                            setOpenForm(true);
                          }}
                          className="btn-ghost px-2 py-1"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        {isOwner && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete customer "${c.name}"?`)) return;
                              try {
                                await del.mutateAsync(c.id);
                                push("Customer deleted");
                              } catch (e: unknown) {
                                push(
                                  e instanceof Error ? e.message : "Failed",
                                  "error"
                                );
                              }
                            }}
                            className="btn-ghost px-2 py-1"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CustomerForm
        open={openForm}
        customer={editing}
        onClose={() => setOpenForm(false)}
      />
    </>
  );
}
