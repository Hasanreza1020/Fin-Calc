import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  PackagePlus,
  Boxes,
  Package,
  Receipt,
  BarChart3,
  Users,
  Settings,
  Gamepad2,
  Contact,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/purchases", label: "Purchases", icon: PackagePlus },
  { to: "/customers", label: "Customers", icon: Contact },
  { to: "/products", label: "Products", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/expenses", label: "Cash flow", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const OWNER_NAV = [
  { to: "/staff", label: "Staff", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

type Props = { onNavigate?: () => void };

export function Sidebar({ onNavigate }: Props) {
  const { isOwner, profile } = useAuth();

  return (
    <aside className="h-full w-60 shrink-0 bg-char border-r border-border flex flex-col">
      <div className="px-4 py-4 border-b border-border flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-white text-ink flex items-center justify-center">
          <Gamepad2 size={16} />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">TPFTVG</div>
          <div className="text-[10px] uppercase tracking-wider text-secondary">
            Financial Tracker
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition ${
                isActive
                  ? "bg-white text-ink font-medium"
                  : "text-secondary hover:text-white hover:bg-slate"
              }`
            }
          >
            <item.icon size={15} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {isOwner && (
          <>
            <div className="pt-4 pb-1.5 px-2.5 text-[10px] uppercase tracking-wider text-subtle">
              Owner
            </div>
            {OWNER_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition ${
                    isActive
                      ? "bg-white text-ink font-medium"
                      : "text-secondary hover:text-white hover:bg-slate"
                  }`
                }
              >
                <item.icon size={15} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-border">
        <div className="text-xs text-white truncate">
          {profile?.full_name ?? "—"}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-secondary">
          {profile?.role ?? "guest"}
        </div>
      </div>
    </aside>
  );
}
