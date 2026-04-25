import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { FullPageSpinner } from "@/components/ui/Spinner";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" state={{ from: loc }} replace />;
  return <>{children}</>;
}

export function RequireOwner({ children }: { children: React.ReactNode }) {
  const { isOwner, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!isOwner) return <Navigate to="/" replace />;
  return <>{children}</>;
}
