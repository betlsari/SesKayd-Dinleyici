import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import type { Company } from "./components/layout/Topbar";
import type { CurrentUser } from "./components/layout/Sidebar";
import RecordsPage from "./pages/RecordsPage";

// Bu veriler ŞİMDİLİK sabit (mock). İlerde .NET API'den
// (örn. GET /api/companies, GET /api/notifications) gelecek.
const mockCompanies: Company[] = [
  { id: 1, name: "Demo A.Ş." },
  { id: 2, name: "Örnek Ltd." },
];

const mockUser: CurrentUser = {
  name: "berkay.guler",
  role: "Yönetici",
  online: true,
};

const canDownloadRecordings = mockUser.role === "Yönetici";
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
              <RecordsPage canDownloadRecordings={canDownloadRecordings} />
            }
          />
          <Route path="/arama-kayitlari" element={<div>Arama kayıtları</div>} />
          <Route path="/istatistikler" element={<div>İstatistikler</div>} />
          <Route path="/raporlar" element={<div>Raporlar</div>} />
          <Route path="/kullanicilar" element={<div>Kullanıcılar</div>} />
          <Route path="/roller" element={<div>Roller</div>} />
          <Route path="/sirketler" element={<div>Şirketler</div>} />
          <Route path="/audit-log" element={<div>Audit Log</div>} />
          <Route
            path="/api-entegrasyonlari"
            element={<div>API Entegrasyonları</div>}
          />
          <Route path="/ayarlar" element={<div>Ayarlar</div>} />
          <Route path="*" element={<div>Kayıtlar sayfasını seçin</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
