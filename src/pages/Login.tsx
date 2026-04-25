import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function Login() {
  const { session, signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    setInfo(null);
  }, [mode]);

  if (!loading && session) return <Navigate to="/" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) setErr(error);
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) setErr(error);
        else setInfo("Account created. Check your email to confirm if required, then sign in.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-9 h-9 rounded bg-white text-ink flex items-center justify-center">
            <Gamepad2 size={18} />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight">TPFTVG</div>
            <div className="text-[10px] uppercase tracking-wider text-secondary">
              Financial Tracker
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-1 mb-4">
            <button
              onClick={() => setMode("signin")}
              className={mode === "signin" ? "pill-on" : "pill"}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={mode === "signup" ? "pill-on" : "pill"}
            >
              Create account
            </button>
          </div>

          {!hasSupabaseEnv && (
            <div className="text-xs text-white bg-slate border border-border rounded p-3 mb-3">
              Supabase env not configured. Copy <span className="font-mono">.env.example</span> to{" "}
              <span className="font-mono">.env</span> and set{" "}
              <span className="font-mono">VITE_SUPABASE_URL</span> and{" "}
              <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>, then restart the dev server.
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <Input
                label="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
            {err && <div className="text-xs text-white bg-slate border border-white rounded p-2">{err}</div>}
            {info && <div className="text-xs text-secondary">{info}</div>}
            <Button type="submit" disabled={busy || !hasSupabaseEnv} className="w-full">
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {mode === "signup" && (
            <p className="text-[11px] text-secondary mt-3 leading-relaxed">
              The first account becomes the <span className="text-white">Owner</span>. All later sign-ups
              are <span className="text-white">Staff</span> and have read/write but cannot delete or manage users.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
