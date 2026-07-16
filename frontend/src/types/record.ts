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

export interface RecordFilters {
  dateFrom: string;
  dateTo: string;
  callerNumber: string;
  calledNumber: string;
  agent: string;
  username: string;
  callId: string;
  company: string;
}
