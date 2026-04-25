import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useCategories, useDeleteCategory } from "@/hooks/queries/useCategories";
import { useToast } from "@/components/ui/Toast";

export function Settings() {
  const cats = useCategories();
  const del = useDeleteCategory();
  const { push } = useToast();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Currency, categories, and other preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Business">
          <dl className="space-y-2 text-sm">
            <Row label="Currency" value="AED — UAE Dirham" />
            <Row label="Locale" value="en-AE" />
            <Row label="Theme" value="Monochrome (dark)" />
          </dl>
        </Card>

        <Card title="Categories" padded={false}>
          {cats.isLoading ? (
            <div className="p-8 flex justify-center">
              <Spinner />
            </div>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Kind</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cats.data?.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <span className="pill capitalize">{c.kind}</span>
                    </td>
                    <td className="text-right">
                      <button
                        className="btn-ghost px-2 py-1"
                        onClick={async () => {
                          if (!confirm(`Delete category "${c.name}"?`)) return;
                          try {
                            await del.mutateAsync(c.id);
                            push("Deleted");
                          } catch (err: unknown) {
                            push(
                              err instanceof Error ? err.message : "Failed",
                              "error"
                            );
                          }
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card title="About" className="mt-4">
        <p className="text-sm text-secondary leading-relaxed">
          StoreFin v0.1 — a private cashflow & inventory tracker for your
          gaming shop. Data is stored in your Supabase project. Backups: enable
          Supabase point-in-time recovery in your project for automatic
          backups.
        </p>
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border last:border-0 pb-2">
      <dt className="text-secondary">{label}</dt>
      <dd className="text-white">{value}</dd>
    </div>
  );
}
