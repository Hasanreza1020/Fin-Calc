import { useState } from "react";
import { Plus, Receipt, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { presetRange, fmtDate, toISODate, type DateRange } from "@/lib/dates";
import { fmtAED } from "@/lib/money";
import {
  useCreateExpense,
  useCreateIncome,
  useDeleteExpense,
  useDeleteIncome,
  useExpenses,
  useOtherIncome,
} from "@/hooks/queries/useCashflow";
import type { ExpenseKind } from "@/lib/database.types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

export function Expenses() {
  const [range, setRange] = useState<DateRange>(presetRange("last30"));
  const [tab, setTab] = useState<"out" | "in">("out");
  const [showExpense, setShowExpense] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const expenses = useExpenses({ from: range.from, to: range.to });
  const income = useOtherIncome({ from: range.from, to: range.to });
  const delE = useDeleteExpense();
  const delI = useDeleteIncome();
  const { isOwner } = useAuth();
  const { push } = useToast();

  const totalE = expenses.data?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const totalI = income.data?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Cash flow"
        description="Expenses (rent, utilities, etc.) and other income (repairs, services)."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowIncome(true)}>
              <Plus size={14} /> Other income
            </Button>
            <Button onClick={() => setShowExpense(true)}>
              <Plus size={14} /> Expense
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <DateRangePicker value={range} onChange={setRange} />
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-secondary">
            {fmtDate(range.from)} – {fmtDate(range.to)}
          </span>
          <span className="font-mono tabular-nums">
            <span className="text-secondary">Expenses: </span>
            <span className="text-white">{fmtAED(totalE)}</span>
          </span>
          <span className="font-mono tabular-nums">
            <span className="text-secondary">Other income: </span>
            <span className="text-white">{fmtAED(totalI)}</span>
          </span>
        </div>
      </Card>

      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={() => setTab("out")}
          className={tab === "out" ? "pill-on" : "pill"}
        >
          <ArrowDownRight size={12} /> Expenses
        </button>
        <button
          onClick={() => setTab("in")}
          className={tab === "in" ? "pill-on" : "pill"}
        >
          <ArrowUpRight size={12} /> Other income
        </button>
      </div>

      <Card padded={false}>
        {tab === "out" ? (
          expenses.isLoading ? (
            <div className="p-10 flex justify-center">
              <Spinner />
            </div>
          ) : !expenses.data || expenses.data.length === 0 ? (
            <EmptyState
              icon={<Receipt size={28} />}
              title="No expenses in range"
              action={
                <Button onClick={() => setShowExpense(true)}>
                  <Plus size={14} /> Expense
                </Button>
              }
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Notes</th>
                  <th className="text-right">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.data.map((e) => (
                  <tr key={e.id}>
                    <td>{fmtDate(e.date)}</td>
                    <td>
                      <span className="pill capitalize">{e.category}</span>
                    </td>
                    <td className="text-secondary">{e.notes ?? "—"}</td>
                    <td className="text-right font-mono tabular-nums">
                      {fmtAED(e.amount)}
                    </td>
                    <td className="text-right">
                      {isOwner && (
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this expense?")) return;
                            try {
                              await delE.mutateAsync(e.id);
                              push("Deleted");
                            } catch (err: unknown) {
                              push(
                                err instanceof Error ? err.message : "Failed",
                                "error"
                              );
                            }
                          }}
                          className="btn-ghost px-2 py-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : income.isLoading ? (
          <div className="p-10 flex justify-center">
            <Spinner />
          </div>
        ) : !income.data || income.data.length === 0 ? (
          <EmptyState
            icon={<ArrowUpRight size={28} />}
            title="No other income in range"
            action={
              <Button onClick={() => setShowIncome(true)}>
                <Plus size={14} /> Other income
              </Button>
            }
          />
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Notes</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {income.data.map((e) => (
                <tr key={e.id}>
                  <td>{fmtDate(e.date)}</td>
                  <td>{e.source}</td>
                  <td className="text-secondary">{e.notes ?? "—"}</td>
                  <td className="text-right font-mono tabular-nums">
                    {fmtAED(e.amount)}
                  </td>
                  <td className="text-right">
                    {isOwner && (
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this income?")) return;
                          try {
                            await delI.mutateAsync(e.id);
                            push("Deleted");
                          } catch (err: unknown) {
                            push(
                              err instanceof Error ? err.message : "Failed",
                              "error"
                            );
                          }
                        }}
                        className="btn-ghost px-2 py-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <ExpenseModal open={showExpense} onClose={() => setShowExpense(false)} />
      <IncomeModal open={showIncome} onClose={() => setShowIncome(false)} />
    </>
  );
}

function ExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateExpense();
  const { push } = useToast();
  const [category, setCategory] = useState<ExpenseKind>("misc");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({
        category,
        amount: Number(amount) || 0,
        date,
        notes: notes.trim() || null,
      });
      push("Expense saved");
      setAmount("");
      setNotes("");
      onClose();
    } catch (err: unknown) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New expense"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!amount || create.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseKind)}
        >
          <option value="rent">Rent</option>
          <option value="utility">Utility</option>
          <option value="salary">Salary</option>
          <option value="supply">Supplies</option>
          <option value="misc">Misc</option>
        </Select>
        <Input
          label="Amount (AED)"
          type="number"
          step="0.01"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

function IncomeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateIncome();
  const { push } = useToast();
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({
        source: source.trim() || "Other",
        amount: Number(amount) || 0,
        date,
        notes: notes.trim() || null,
      });
      push("Income saved");
      setSource("");
      setAmount("");
      setNotes("");
      onClose();
    } catch (err: unknown) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Other income"
      description="Money in that isn't a product sale (e.g. repair, service fee)"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!amount || create.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g. Console repair"
          required
        />
        <Input
          label="Amount (AED)"
          type="number"
          step="0.01"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
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
