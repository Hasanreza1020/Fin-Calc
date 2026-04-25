import { useState } from "react";
import { Menu, LogOut, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

type Props = { onOpenSidebar: () => void };

export function Topbar({ onOpenSidebar }: Props) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 border-b border-border bg-char flex items-center px-3 sm:px-5 gap-3 sticky top-0 z-30">
      <button
        onClick={onOpenSidebar}
        className="lg:hidden text-secondary hover:text-white p-1.5 rounded"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate("/sales/new")}
        >
          <Plus size={14} /> New sale
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate("/purchases/new")}
        >
          <Plus size={14} /> New purchase
        </Button>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate transition"
        >
          <div className="w-6 h-6 rounded-full bg-white text-ink flex items-center justify-center text-xs font-semibold">
            {(profile?.full_name ?? "U")[0].toUpperCase()}
          </div>
          <span className="hidden sm:block text-xs text-white max-w-[120px] truncate">
            {profile?.full_name ?? "User"}
          </span>
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 mt-1 w-48 bg-char border border-border rounded-lg shadow-xl py-1 z-20 animate-fade-in">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-xs text-white truncate">
                  {profile?.full_name ?? "—"}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-secondary">
                  {profile?.role ?? "guest"}
                </div>
              </div>
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                }}
                className="w-full text-left px-3 py-2 text-sm text-secondary hover:text-white hover:bg-slate flex items-center gap-2"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
