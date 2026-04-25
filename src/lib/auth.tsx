import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, hasSupabaseEnv } from "@/lib/supabase";
import type { Role } from "@/lib/database.types";

type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isOwner: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

const DEMO_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "demo@storefin.local",
  app_metadata: {},
  user_metadata: { full_name: "Demo Owner" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

const DEMO_SESSION = {
  access_token: "demo",
  refresh_token: "demo",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: DEMO_USER,
} as unknown as Session;

const DEMO_PROFILE: Profile = {
  id: DEMO_USER.id,
  full_name: "Demo Owner",
  role: "owner",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(
    DEMO_MODE ? DEMO_SESSION : null
  );
  const [profile, setProfile] = useState<Profile | null>(
    DEMO_MODE ? DEMO_PROFILE : null
  );
  const [loading, setLoading] = useState(!DEMO_MODE);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", userId)
      .maybeSingle();
    setProfile((data as unknown as Profile | null) ?? null);
  }

  useEffect(() => {
    if (DEMO_MODE) return;
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, sess) => {
        setSession(sess);
        if (sess?.user) await loadProfile(sess.user.id);
        else setProfile(null);
      }
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isOwner: profile?.role === "owner",
    isDemo: DEMO_MODE,
    async signIn(email, password) {
      if (DEMO_MODE) return { error: null };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message ?? null };
    },
    async signUp(email, password, fullName) {
      if (DEMO_MODE) return { error: null };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) return { error: error.message };
      if (data.user) await loadProfile(data.user.id);
      return { error: null };
    },
    async signOut() {
      if (DEMO_MODE) return;
      await supabase.auth.signOut();
      setProfile(null);
    },
    async refreshProfile() {
      if (DEMO_MODE) return;
      if (session?.user) await loadProfile(session.user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
