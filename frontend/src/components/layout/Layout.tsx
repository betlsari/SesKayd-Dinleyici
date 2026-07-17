import { type ReactNode } from "react";
import Sidebar, { type CurrentUser } from "./Sidebar";
import Topbar, { type Company } from "./Topbar";
import "./Layout.css";

interface LayoutProps {
  children: ReactNode;
  currentUser?: CurrentUser;
  currentCompany?: Company;
  companies?: Company[];
  notificationCount?: number;
  onCompanyChange?: (company: Company) => void;
  // Topbar kullanıcı menüsündeki "Çıkış Yap" için — gerçek Keycloak
  // logout'una (bkz. src/auth/AuthProvider.tsx) bağlanır.
  onLogout?: () => void;
}

export default function Layout({
  children,
  currentUser,
  currentCompany,
  companies,
  notificationCount,
  onCompanyChange,
  onLogout,
}: LayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar currentUser={currentUser} />

      <div className="app-main">
        <Topbar
          currentCompany={currentCompany}
          companies={companies}
          notificationCount={notificationCount}
          onCompanyChange={onCompanyChange}
          onLogout={onLogout}
        />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
