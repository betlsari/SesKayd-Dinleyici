import { useState } from "react";
import { Search, X } from "lucide-react";
import type { RecordFilters } from "../../types/record";
import "./RecordsFilterForm.css";

interface RecordsFilterFormProps {
  onSearch: (filters: RecordFilters) => void;
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
}: RecordsFilterFormProps) {
  const [filters, setFilters] = useState<RecordFilters>(emptyFilters);

  function updateField<K extends keyof RecordFilters>(
    field: K,
    value: RecordFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleSearch() {
    onSearch(filters);
  }

  function handleClear() {
    setFilters(emptyFilters);
    onSearch(emptyFilters);
  }

  return (
    <div className="records-filter">
      <div className="records-filter-grid">
        <div className="filter-field">
          <label htmlFor="dateFrom">Tarih Aralığı</label>
          <div className="date-range-inputs">
            <input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateField("dateFrom", e.target.value)}
            />
            <span>–</span>
            <input
              type="date"
              aria-label="Bitiş tarihi"
              value={filters.dateTo}
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
