import { useState, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import type { Company } from "./components/layout/Topbar";
import RecordsPage from "./pages/RecordsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import { canAccessPath } from "./auth/permissions";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/AuthContext";

// TODO: Şirket listesi (kullanıcının erişebildiği şirketler) backend'den
// gelecek. Keycloak token'ı SADECE kimliği doğrular — "bu kullanıcı hangi
// şirketlere erişebilir" bilgisi bir iş/yetki verisidir ve .NET API'den
// (kullanıcının rolüne/atamasına göre) gelmelidir. O entegrasyon hazır
// olana kadar mockCompanies burada kalıyor.
const mockCompanies: Company[] = [
  { id: 1, name: "Demo A.Ş." },
  { id: 2, name: "Örnek Ltd." },
];

// Rol bazlı route koruması. Sidebar'da link gizlense bile, adres
// çubuğuna doğrudan path yazan biri sayfayı görmemeli.
//
// NOT: Bu, gerçek bir güvenlik sınırı DEĞİLDİR (bkz. auth/permissions.ts
// başındaki not) — client-side state değiştirilerek atlatılabilir.
// Gerçek yetkilendirme backend'de (.NET + Keycloak token doğrulaması ile)
// yapılmalıdır. Bu sadece UI/UX tutarlılığı içindir.
function ProtectedRoute({
  path,
  role,
  children,
}: {
  path: string;
  role: string;
  children: ReactNode;
}) {
  const allowed = canAccessPath(path, role);
  if (!allowed) {
    return <Navigate to="/kayitlar" replace />;
  }
  return <>{children}</>;
}

// AuthProvider zaten kimlik doğrulaması bitene kadar (initializing/error)
// kendi ekranını gösteriyor; bu bileşen çalıştığında kullanıcı kesin
// olarak doğrulanmıştır (bkz. src/auth/AuthProvider.tsx).
function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const [currentCompany, setCurrentCompany] = useState<Company>(
    mockCompanies[0],
  );

  // Keycloak'taki rol, uygulamanın bildiği bir role (Yönetici/Analist/
  // Supervisor) eşleşmediyse `user.role` null olur. Bilinmeyen/atanmamış
  // rol durumunda EN KISITLI davranışı seçiyoruz — boş string,
  // auth/permissions.ts içindeki isKnownRole tarafından "izin yok"
  // olarak değerlendirilir.
  const currentUserRole = user?.role ?? "";

  const currentUser = {
    name: user?.username ?? "bilinmeyen-kullanici",
    role: currentUserRole || "Rol atanmamış",
    online: true,
  };

  return (
    <BrowserRouter>
      <Layout
        currentUser={currentUser}
        currentCompany={currentCompany}
        companies={mockCompanies}
        notificationCount={3}
        onCompanyChange={setCurrentCompany}
        onLogout={logout}
      >
        <Routes>
          <Route
            path="/kayitlar"
            element={
              <RecordsPage
                key={currentCompany.id}
                currentCompanyName={currentCompany.name}
                currentUserRole={currentUserRole}
                companies={mockCompanies}
                currentCompany={currentCompany}
                onCompanyChange={setCurrentCompany}
              />
            }
          />
          <Route
            path="/arama-kayitlari"
            element={<ComingSoonPage title="Arama Kayıtları" />}
          />
          <Route
            path="/istatistikler"
            element={<ComingSoonPage title="İstatistikler" />}
          />
          <Route
            path="/raporlar"
            element={<ComingSoonPage title="Raporlar" />}
          />

          <Route
            path="/kullanicilar"
            element={
              <ProtectedRoute path="/kullanicilar" role={currentUserRole}>
                <ComingSoonPage title="Kullanıcılar" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roller"
            element={
              <ProtectedRoute path="/roller" role={currentUserRole}>
                <ComingSoonPage title="Roller" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sirketler"
            element={
              <ProtectedRoute path="/sirketler" role={currentUserRole}>
                <ComingSoonPage title="Şirketler" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute path="/audit-log" role={currentUserRole}>
                <ComingSoonPage title="Audit Log" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-entegrasyonlari"
            element={
              <ProtectedRoute
                path="/api-entegrasyonlari"
                role={currentUserRole}
              >
                <ComingSoonPage title="API Entegrasyonları" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayarlar"
            element={
              <ProtectedRoute path="/ayarlar" role={currentUserRole}>
                <ComingSoonPage title="Ayarlar" />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<ComingSoonPage title="Kayıtlar sayfasını seçin" />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
