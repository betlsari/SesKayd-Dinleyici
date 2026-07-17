import { useMemo, useState } from "react";
import { X } from "lucide-react";
import RecordsFilterForm from "../components/records/RecordsFilterForm";
import RecordsTable from "../components/records/RecordsTable";
import Pagination from "../components/records/Pagination";
import RecordDetailPanel from "../components/records/RecordDetailPanel";
import type { CallRecord, RecordFilters } from "../types/record";
import "./RecordsPage.css";

const PAGE_SIZE = 10;

// Şimdilik sabit (mock) veri üretiyoruz. İlerde bu, .NET API'den
// GET /api/records?companyId=...&dateFrom=...&callerNumber=... gibi bir
// çağrıyla gelecek.
//
// NOT: Dinleme logları burada YOK — onlar artık audit log sisteminden
// (read-only) ayrıca çekiliyor. Bkz. src/services/auditLogService.ts
function generateMockRecords(): CallRecord[] {
  const companies = ["Demo A.Ş.", "Örnek Ltd."];
  // Agent'ın hem görünen adı hem e-postası ayrı ayrı tutuluyor
  // (doküman: "Agent" ve "Agent E-posta" iki farklı alan).
  const agents = [
    { name: "Ahmet Yılmaz", email: "ahmet.yilmaz@demo.com" },
    { name: "Zeynep Kaya", email: "zeynep.kaya@demo.com" },
    { name: "Mehmet Can", email: "mehmet.can@demo.com" },
  ];
  const usernames = ["mehmet.kaya", "ayse.demir", "can.yildiz"];

  return Array.from({ length: 34 }, (_, index) => {
    const day = String(1 + (index % 28)).padStart(2, "0");
    const hour = String(9 + (index % 8)).padStart(2, "0");
    const minute = String((index * 7) % 60).padStart(2, "0");
    const agent = agents[index % agents.length];

    return {
      id: `rec-${index + 1}`,
      dateTime: `${day}.07.2026 ${hour}:${minute}`,
      callerNumber: `0555${String(1000000 + index).slice(0, 7)}`,
      calledNumber: `0212${String(2000000 + index).slice(0, 7)}`,
      agentName: agent.name,
      agentEmail: agent.email,
      username: usernames[index % usernames.length],
      durationSeconds: 60 + ((index * 37) % 600),
      callId: `CALL-${100000 + index}`,
      company: companies[index % companies.length],
      fileSizeKB: 1800 + ((index * 137) % 6000),
      format: "WAV",
    };
  });
}

const allRecords = generateMockRecords();

// "dd.MM.yyyy HH:mm" formatındaki tarihi sıralanabilir bir sayıya çeviriyoruz.
function parseDateTime(value: string): number {
  const [datePart, timePart] = value.split(" ");
  const [day, month, year] = datePart.split(".").map(Number);
  const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
}

type ActiveTab = "list" | "detail";

interface RecordsPageProps {
  // Topbar'daki şirket seçicisinden gelen o anki aktif şirket.
  // Kullanıcı SADECE bu şirkete ait kayıtları görebilmeli
  // (doküman madde 4: "Kullanıcılar yalnızca yetkili oldukları şirket
  // kayıtlarını görüntüleyebilecektir").
  //
  // TODO: .NET entegrasyonu hazır olunca bu değer backend'e
  // GET /api/records?companyId=... şeklinde query param olarak
  // gönderilecek; o zaman client-side filtreleme (aşağıdaki
  // companyScopedRecords) kaldırılacak çünkü backend zaten sadece
  // o şirketin verisini dönecek. Şu an backend olmadığı için
  // client tarafında filtreliyoruz.
  currentCompanyName: string;
}

// NOT: Bu sayfada ve alt bileşenlerinde (RecordsTable, RecordDetailPanel,
// AudioRecordingCard) KASITLI olarak bir "canDownloadRecordings" / indirme
// kavramı YOK. Ses kayıtları hiçbir kullanıcı rolü için indirilemez —
// bkz. AudioRecordingCard.tsx başındaki backend güvenlik notları.
export default function RecordsPage({ currentCompanyName }: RecordsPageProps) {
  const [filters, setFilters] = useState<RecordFilters | null>(null);
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>("list");
  const [selectedRecord, setSelectedRecord] = useState<CallRecord | null>(null);
  const [autoPlayDetail, setAutoPlayDetail] = useState(false);

  // GÜVENLİK: Kullanıcının seçtiği şirket ne olursa olsun, aşağıdaki
  // adımların HİÇBİRİ bu scope'un dışına çıkamaz. Filtre formu ve
  // sıralama, sadece bu diziye uygulanır; tüm allRecords'a değil.
  const companyScopedRecords = useMemo(
    () => allRecords.filter((record) => record.company === currentCompanyName),
    [currentCompanyName],
  );

  const filteredRecords = useMemo(() => {
    if (!filters) return companyScopedRecords;

    return companyScopedRecords.filter((record) => {
      if (
        filters.callerNumber &&
        !record.callerNumber.includes(filters.callerNumber)
      ) {
        return false;
      }
      if (
        filters.calledNumber &&
        !record.calledNumber.includes(filters.calledNumber)
      ) {
        return false;
      }
      if (
        filters.agent &&
        !record.agentName.toLowerCase().includes(filters.agent.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.username &&
        !record.username.toLowerCase().includes(filters.username.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.callId &&
        !record.callId.toLowerCase().includes(filters.callId.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [companyScopedRecords, filters]);

  const sortedRecords = useMemo(() => {
    if (!sortDirection) return filteredRecords;
    const copy = [...filteredRecords];
    copy.sort((a, b) => {
      const diff = parseDateTime(a.dateTime) - parseDateTime(b.dateTime);
      return sortDirection === "asc" ? diff : -diff;
    });
    return copy;
  }, [filteredRecords, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / PAGE_SIZE));
  const pageRecords = sortedRecords.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  // Kayıt Detayları içindeki "Önceki/Sonraki kayıt" gezinmesi için,
  // seçili kaydın filtrelenmiş+sıralanmış tüm liste içindeki konumunu buluyoruz
  // (sadece o anki sayfayla sınırlı değil).
  const currentIndex = selectedRecord
    ? sortedRecords.findIndex((r) => r.id === selectedRecord.id)
    : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < sortedRecords.length - 1;

  function handleSearch(nextFilters: RecordFilters) {
    setFilters(nextFilters);
    setPage(1);
  }

  function handleSortToggle() {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  }

  // Oynat butonuna basılınca: Kayıt Detayları sekmesine geç ve otomatik çal.
  function handlePlay(record: CallRecord) {
    setSelectedRecord(record);
    setActiveTab("detail");
    setAutoPlayDetail(true);
  }

  // Bilgi ikonuna veya satıra çift tıklanınca: sekmeye geç ama otomatik çalma.
  function handleOpenDetail(record: CallRecord) {
    setSelectedRecord(record);
    setActiveTab("detail");
    setAutoPlayDetail(false);
  }

  function handleCloseDetail() {
    setSelectedRecord(null);
    setActiveTab("list");
  }

  // Kayıt Detayları içindeki "Önceki kayıt" / "Sonraki kayıt" butonları.
  function handlePreviousRecord() {
    if (!hasPrevious) return;
    setSelectedRecord(sortedRecords[currentIndex - 1]);
    setAutoPlayDetail(true);
  }

  function handleNextRecord() {
    if (!hasNext) return;
    setSelectedRecord(sortedRecords[currentIndex + 1]);
    setAutoPlayDetail(true);
  }

  function handleDelete(record: CallRecord) {
    // TODO: .NET API'ye silme isteği (örn. DELETE /api/records/{id})
    // TODO: Bu aksiyon şu an rol kontrolü olmadan herkese açık — ayrı
    // bir "canDelete" yetkisi ile kısıtlanması gerekiyor.
    console.log("Silinecek kayıt:", record.id);
  }

  return (
    <div className="records-page">
      <div className="records-page-header">
        <h1>Ses Kayıtları</h1>
        <p>
          {currentCompanyName} şirketine ait kayıtları listeleyin ve dinleyin.
        </p>
      </div>

      <div className="records-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "list"}
          className={"records-tab" + (activeTab === "list" ? " is-active" : "")}
          onClick={() => setActiveTab("list")}
        >
          Kayıt Listesi
        </button>

        {selectedRecord && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "detail"}
            className={
              "records-tab" + (activeTab === "detail" ? " is-active" : "")
            }
            onClick={() => setActiveTab("detail")}
          >
            Kayıt Detayları
            <span
              className="records-tab-close"
              role="button"
              aria-label="Detay sekmesini kapat"
              onClick={(event) => {
                event.stopPropagation();
                handleCloseDetail();
              }}
            >
              <X size={13} />
            </span>
          </button>
        )}
      </div>

      {activeTab === "list" ? (
        <>
          <RecordsFilterForm onSearch={handleSearch} />

          <RecordsTable
            records={pageRecords}
            totalCount={sortedRecords.length}
            sortDirection={sortDirection}
            onSortToggle={handleSortToggle}
            onPlay={handlePlay}
            onOpenDetail={handleOpenDetail}
            onDelete={handleDelete}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        selectedRecord && (
          <RecordDetailPanel
            key={selectedRecord.id}
            record={selectedRecord}
            autoPlay={autoPlayDetail}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={handlePreviousRecord}
            onNext={handleNextRecord}
          />
        )
      )}
    </div>
  );
}
