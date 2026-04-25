import { useState } from "react";
import { Search, Plus, X, User } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { CustomerForm } from "@/components/forms/CustomerForm";
import {
  useCustomers,
  type Customer,
} from "@/hooks/queries/useCustomers";

type Picked = { id: string; name: string };

type Props = {
  value: Picked | null;
  onChange: (next: Picked | null) => void;
};

export function CustomerPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const customers = useCustomers({ search });

  function pick(c: Customer) {
    onChange({ id: c.id, name: c.name });
    setOpen(false);
    setSearch("");
  }

  return (
    <div>
      <label className="label">Customer</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="input-base text-left flex-1 flex items-center gap-2"
        >
          <User size={14} className="text-secondary" />
          <span className={value ? "text-white" : "text-subtle"}>
            {value?.name || "Walk-in (click to pick or add)"}
          </span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="btn-ghost px-2 py-2"
            title="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Pick a customer"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setOpenNew(true)}>
              <Plus size={14} /> New customer
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email"
              autoFocus
              className="pl-8"
            />
          </div>
          <div className="max-h-72 overflow-y-auto border border-border rounded">
            {customers.isLoading ? (
              <div className="p-6 flex justify-center">
                <Spinner />
              </div>
            ) : !customers.data || customers.data.length === 0 ? (
              <div className="p-6 text-center text-sm text-secondary">
                {search ? "No matches" : "No customers yet — add one below."}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {customers.data.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => pick(c)}
                      className="w-full text-left px-3 py-2 hover:bg-slate flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm text-white">{c.name}</div>
                        <div className="text-xs text-secondary">
                          {[c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                      <div className="text-xs text-secondary text-right">
                        <div>{c.order_count} orders</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      <CustomerForm
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreated={(c) => {
          pick(c);
          setOpenNew(false);
        }}
      />
    </div>
  );
}
