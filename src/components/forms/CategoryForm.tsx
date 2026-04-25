import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useCreateCategory } from "@/hooks/queries/useCategories";
import type { CategoryKind } from "@/lib/database.types";
import { useToast } from "@/components/ui/Toast";

export function CategoryForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>("accessory");
  const create = useCreateCategory();
  const { push } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({ name: name.trim(), kind });
      push("Category created");
      setName("");
      onClose();
    } catch (err: unknown) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New category"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>
            Create
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Select
          label="Kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as CategoryKind)}
        >
          <option value="console">Console</option>
          <option value="accessory">Accessory</option>
          <option value="game">Game</option>
          <option value="other">Other</option>
        </Select>
      </form>
    </Modal>
  );
}
