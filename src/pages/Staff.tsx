import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useProfiles, useUpdateProfile } from "@/hooks/queries/useStaff";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth";
import { fmtDateTime } from "@/lib/dates";
import type { Role } from "@/lib/database.types";

export function Staff() {
  const profiles = useProfiles();
  const update = useUpdateProfile();
  const { user } = useAuth();
  const { push } = useToast();

  return (
    <>
      <PageHeader
        title="Staff"
        description="Manage who can use the app and what they can do."
      />

      <Card className="mb-4">
        <p className="text-sm text-secondary leading-relaxed">
          New users sign up themselves on the login page using the email and
          password you give them. They are assigned the{" "}
          <span className="text-white">staff</span> role automatically. Only
          you (the <span className="text-white">owner</span>) can promote
          someone or delete records.
        </p>
        <p className="text-xs text-secondary mt-2">
          Tip: in your Supabase project under <span className="font-mono">Auth → Settings</span>,
          you can disable open sign-ups so only invited users can register.
        </p>
      </Card>

      <Card padded={false}>
        {profiles.isLoading ? (
          <div className="p-10 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {profiles.data?.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="text-white">
                      {p.full_name ?? "—"}
                    </span>
                    {p.id === user?.id && (
                      <span className="ml-2 pill">you</span>
                    )}
                  </td>
                  <td>
                    <span className={p.role === "owner" ? "pill-on" : "pill"}>
                      {p.role}
                    </span>
                  </td>
                  <td className="text-secondary text-xs">
                    {fmtDateTime(p.created_at)}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {p.id !== user?.id && (
                      <select
                        value={p.role}
                        onChange={async (e) => {
                          try {
                            await update.mutateAsync({
                              id: p.id,
                              patch: { role: e.target.value as Role },
                            });
                            push("Role updated");
                          } catch (err: unknown) {
                            push(
                              err instanceof Error ? err.message : "Failed",
                              "error"
                            );
                          }
                        }}
                        className="input-base text-xs py-1 w-24"
                      >
                        <option value="staff">staff</option>
                        <option value="owner">owner</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
