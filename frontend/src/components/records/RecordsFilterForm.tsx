import { useMemo, useState } from "react";
import { Search, X, AlertCircle } from "lucide-react";
import type { RecordFilters } from "../../types/record";
import type { Company } from "../layout/Topbar";
import "./RecordsFilterForm.css";

interface RecordsFilterFormProps {
  onSearch: (filters: RecordFilters) => void;
  // ---------------------------------------------------------------
  // Şirket alanı — tasarım dokümanındaki filtre listesinde yer alıyor,
  // ama bu KLASİK bir metin filtresi DEĞİL: RecordsPage.tsx'teki
  // "GÜVENLİK" notunda açıklandığı gibi, kullanıcı aynı anda yalnızca
  // TEK bir şirketin kayıtlarını görebilir (doküman madde 4). Bu yüzden
  // burada seçim yapıldığı anda (Ara butonu beklenmeden) doğrudan
  // onCompanyChange tetiklenir — Topbar'daki şirket seçiciyle BİREBİR
  // aynı mekanizmadır, sadece dokümanın istediği gibi filtre panelinde
  // de görünür olması sağlanmıştır. İki kontrol de her zaman aynı
  // "currentCompany" state'ini yansıtır, birbirinden asla sapmaz.
  // ---------------------------------------------------------------
  companies: Company[];
  currentCompany?: Company;
  onCompanyChange: (company: Company) => void;
}

const emptyFilters: RecordFilters = {
  dateFrom: "",
  dateTo: "",
  callerNumber: "",
  calledNumber: "",
  agent: "",
  username: "",
  callId: "",
};

export default function RecordsFilterForm({
  onSearch,
  companies,
  currentCompany,
  onCompanyChange,
}: RecordsFilterFormProps) {
  const [filters, setFilters] = useState<RecordFilters>(emptyFilters);
  // Kullanıcı "Ara"ya bastıktan sonra hata mesajını göstermeye başlıyoruz;
  // her tuşta hemen kırmızı çerçeve göstermek yerine, ilk denemeden sonra
  // gerçek zamanlı geri bildirim veriyoruz.
  const [hasAttemptedSearch, setHasAttemptedSearch] = useState(false);

  // Tarih aralığı geçersiz mi? (başlangıç, bitişten sonra olamaz)
  // İkisi de doluyken kontrol ediyoruz; sadece biri doluysa hata yok.
  const dateRangeError = useMemo(() => {
    if (!filters.dateFrom || !filters.dateTo) return null;
    if (filters.dateFrom > filters.dateTo) {
      return "Başlangıç tarihi, bitiş tarihinden sonra olamaz.";
    }
    return null;
  }, [filters.dateFrom, filters.dateTo]);

  const showDateRangeError = hasAttemptedSearch && dateRangeError !== null;

  function updateField<K extends keyof RecordFilters>(
    field: K,
    value: RecordFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleSearch() {
    setHasAttemptedSearch(true);
    // Geçersiz tarih aralığıyla arama yapılmasını engelliyoruz; hata
    // mesajı zaten kullanıcıya gösteriliyor, burada sessizce çıkıyoruz.
    if (dateRangeError) return;
    onSearch(filters);
  }

  function handleClear() {
    setFilters(emptyFilters);
    setHasAttemptedSearch(false);
    onSearch(emptyFilters);
  }

  function handleCompanySelect(companyId: string) {
    const selected = companies.find((c) => String(c.id) === companyId);
    if (selected) onCompanyChange(selected);
  }

  return (
    <div className="records-filter">
      <div className="records-filter-grid">
        <div className="filter-field">
          <label htmlFor="dateFrom">Tarih Aralığı</label>
          <div
            className={
              "date-range-inputs" + (showDateRangeError ? " has-error" : "")
            }
          >
            <input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              aria-invalid={showDateRangeError}
              aria-describedby={
                showDateRangeError ? "date-range-error" : undefined
              }
              onChange={(e) => updateField("dateFrom", e.target.value)}
            />
            <span>–</span>
            <input
              type="date"
              aria-label="Bitiş tarihi"
              value={filters.dateTo}
              aria-invalid={showDateRangeError}
              aria-describedby={
                showDateRangeError ? "date-range-error" : undefined
              }
              onChange={(e) => updateField("dateTo", e.target.value)}
            />
            {(filters.dateFrom || filters.dateTo) && (
              <button
                type="button"
                className="date-range-clear"
                aria-label="Tarih aralığını temizle"
                onClick={() => {
                  updateField("dateFrom", "");
                  updateField("dateTo", "");
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {showDateRangeError && (
            <p
              id="date-range-error"
              className="filter-field-error"
              role="alert"
            >
              <AlertCircle size={13} />
              {dateRangeError}
            </p>
          )}
        </div>

        <div className="filter-field">
          <label htmlFor="callerNumber">Arayan Numara</label>
          <input
            id="callerNumber"
            type="text"
            placeholder="Arayan numara"
            value={filters.callerNumber}
            onChange={(e) => updateField("callerNumber", e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="calledNumber">Aranan Numara</label>
          <input
            id="calledNumber"
            type="text"
            placeholder="Aranan numara"
            value={filters.calledNumber}
            onChange={(e) => updateField("calledNumber", e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="agent">Agent</label>
          <input
            id="agent"
            type="text"
            placeholder="Agent adı"
            value={filters.agent}
            onChange={(e) => updateField("agent", e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="callId">Çağrı ID</label>
          <input
            id="callId"
            type="text"
            placeholder="Çağrı ID"
            value={filters.callId}
            onChange={(e) => updateField("callId", e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="username">Kullanıcı Adı</label>
          <input
            id="username"
            type="text"
            placeholder="Kullanıcı adı"
            value={filters.username}
            onChange={(e) => updateField("username", e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="company">Şirket</label>
          <select
            id="company"
            value={currentCompany ? String(currentCompany.id) : ""}
            onChange={(e) => handleCompanySelect(e.target.value)}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="records-filter-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleClear}
        >
          <X size={16} />
          Temizle
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSearch}
        >
          <Search size={16} />
          Ara
        </button>
      </div>
    </div>
  );
}
