import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  useCreateCustomer,
  useUpdateCustomer,
  type Customer,
} from "@/hooks/queries/useCustomers";
import { useToast } from "@/components/ui/Toast";

type Props = {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onCreated?: (c: Customer) => void;
};

export function CustomerForm({ open, onClose, customer, onCreated }: Props) {
  const editing = !!customer;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const { push } = useToast();

  useEffect(() => {
    if (open) {
      setName(customer?.name ?? "");
      setPhone(customer?.phone ?? "");
      setEmail(customer?.email ?? "");
      setAddress(customer?.address ?? "");
      setNotes(customer?.notes ?? "");
    }
  }, [open, customer]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      if (editing && customer) {
        await update.mutateAsync({
          id: customer.id,
          patch: {
            name: trimmed,
            phone: phone.trim() || null,
            email: email.trim() || null,
            address: address.trim() || null,
            notes: notes.trim() || null,
          },
        });
        push("Customer updated");
      } else {
        const created = await create.mutateAsync({
          name: trimmed,
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
        });
        push("Customer added");
        onCreated?.(created);
      }
      onClose();
    } catch (err: unknown) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  const busy = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit customer" : "New customer"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || busy}>
            {editing ? "Save" : "Create"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Input
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  );
}
