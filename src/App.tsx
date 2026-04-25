import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth, RequireOwner } from "@/components/RequireAuth";
import { ToastProvider } from "@/components/ui/Toast";

import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Sales } from "@/pages/Sales";
import { SaleNew } from "@/pages/SaleNew";
import { Purchases } from "@/pages/Purchases";
import { PurchaseNew } from "@/pages/PurchaseNew";
import { Customers } from "@/pages/Customers";
import { Products } from "@/pages/Products";
import { ProductDetail } from "@/pages/ProductDetail";
import { Inventory } from "@/pages/Inventory";
import { Expenses } from "@/pages/Expenses";
import { Reports } from "@/pages/Reports";
import { Staff } from "@/pages/Staff";
import { Settings } from "@/pages/Settings";

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/sales" element={<Protected><Sales /></Protected>} />
        <Route path="/sales/new" element={<Protected><SaleNew /></Protected>} />
        <Route path="/purchases" element={<Protected><Purchases /></Protected>} />
        <Route path="/purchases/new" element={<Protected><PurchaseNew /></Protected>} />
        <Route path="/customers" element={<Protected><Customers /></Protected>} />
        <Route path="/products" element={<Protected><Products /></Protected>} />
        <Route path="/products/:id" element={<Protected><ProductDetail /></Protected>} />
        <Route path="/inventory" element={<Protected><Inventory /></Protected>} />
        <Route path="/expenses" element={<Protected><Expenses /></Protected>} />
        <Route path="/reports" element={<Protected><Reports /></Protected>} />
        <Route
          path="/staff"
          element={
            <Protected>
              <RequireOwner><Staff /></RequireOwner>
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected>
              <RequireOwner><Settings /></RequireOwner>
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
