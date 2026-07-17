import { useState, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import type { Company } from "./components/layout/Topbar";
import type { CurrentUser } from "./components/layout/Sidebar";
import RecordsPage from "./pages/RecordsPage";
import { canAccessPath } from "./auth/permissions";

const mockCompanies: Company[] = [
  { id: 1, name: "Demo A.Ş." },
  { id: 2, name: "Örnek Ltd." },
];

const mockUser: CurrentUser = {
  name: "berkay.guler",
  role: "Yönetici",
  online: true,
};

// Rol bazlı route koruması. Sidebar'da link gizlense bile, adres
// çubuğuna doğrudan path yazan biri sayfayı görmemeli — bu component
// olmadan Sidebar'daki filtreleme sadece "gizli ama erişilebilir"
// bir görünüm sağlıyordu, gerçek bir koruma değildi.
//
// NOT: Bu, gerçek bir güvenlik sınırı DEĞİLDİR (bkz. auth/permissions.ts
// başındaki not) — client-side state değiştirilerek atlatılabilir.
// Gerçek yetkilendirme backend'de (.NET + Keycloak) yapılmalı. Bu sadece
// mock aşamada UI/UX tutarlılığı içindir.
//
// TODO: .NET + Keycloak entegrasyonu sonrası `mockUser.role` yerine
// gerçek oturum/context'ten gelen rol kullanılacak; bu component'in
// dışarıya açtığı davranış (yetkisizse /kayitlar'a yönlendirme) aynı
// kalacak.
function ProtectedRoute({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const allowed = canAccessPath(path, mockUser.role);
  if (!allowed) {
    return <Navigate to="/kayitlar" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [currentCompany, setCurrentCompany] = useState<Company>(
    mockCompanies[0],
  );

  return (
    <BrowserRouter>
      <Layout
        currentUser={mockUser}
        currentCompany={currentCompany}
        companies={mockCompanies}
        notificationCount={3}
        onCompanyChange={setCurrentCompany}
      >
        <Routes>
          <Route
            path="/kayitlar"
            element={
              <RecordsPage
                key={currentCompany.id}
                currentCompanyName={currentCompany.name}
                currentUserRole={mockUser.role}
              />
            }
          />
          <Route path="/arama-kayitlari" element={<div>Arama kayıtları</div>} />
          <Route path="/istatistikler" element={<div>İstatistikler</div>} />
          <Route path="/raporlar" element={<div>Raporlar</div>} />

          <Route
            path="/kullanicilar"
            element={
              <ProtectedRoute path="/kullanicilar">
                <div>Kullanıcılar</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roller"
            element={
              <ProtectedRoute path="/roller">
                <div>Roller</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sirketler"
            element={
              <ProtectedRoute path="/sirketler">
                <div>Şirketler</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute path="/audit-log">
                <div>Audit Log</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-entegrasyonlari"
            element={
              <ProtectedRoute path="/api-entegrasyonlari">
                <div>API Entegrasyonları</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayarlar"
            element={
              <ProtectedRoute path="/ayarlar">
                <div>Ayarlar</div>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<div>Kayıtlar sayfasını seçin</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
