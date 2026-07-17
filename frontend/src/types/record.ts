// Kayıt listesinde ve kayıt detayında tekrar tekrar kullanacağımız
// veri şekillerini burada tek yerde tanımlıyoruz.

export interface ListenLog {
  id: string;
  dateTime: string;
  user: string;
  role: string;
  action: "Dinleme" | "İndirme";
  ipAddress: string;
}

export interface CallRecord {
  id: string;
  dateTime: string;
  callerNumber: string;
  calledNumber: string;
  // Agent'ın görünen adı (örn. "Ahmet Yılmaz"). Tasarım dokümanında
  // "Agent" ve "Agent E-posta" ayrı ayrı alanlar olarak isteniyor.
  agentName: string;
  agentEmail: string;
  username: string;
  durationSeconds: number;
  callId: string;
  company: string;
  fileSizeKB: number;
  format: string;
  // NOT: "listenLogs" burada YOK. Dinleme logları artık kaydın kendi
  // verisi değil, audit log sisteminden ayrıca (read-only) çekiliyor.
  // Bkz. src/services/auditLogService.ts ve ListenLogsTable.tsx
}

// NOT: "company" burada KASITLI olarak yok. Şirket, artık filtre formunda
// seçilen bir alan değil; Topbar'daki şirket seçiciyle (currentCompany)
// sayfa seviyesinde belirleniyor ve kullanıcı SADECE o şirketin kayıtlarını
// görebiliyor (bkz. RecordsPage.tsx). Burada ayrıca bir "company" filtresi
// olması, kullanıcının yetkisi olmayan bir şirketi filtre olarak seçip
// verisine erişebileceği yanlış izlenimini verir.
export interface RecordFilters {
  dateFrom: string;
  dateTo: string;
  callerNumber: string;
  calledNumber: string;
  // Agent adına göre filtre (doküman: "Agent" filtre alanı).
  agent: string;
  username: string;
  callId: string;
}
