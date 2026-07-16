// Kayıt listesinde ve kayıt detayında tekrar tekrar kullanacağımız
// veri şekillerini burada tek yerde tanımlıyoruz.

export interface ListenLog {
  id: string;
  dateTime: string;
  user: string;
  role: string;
  action: string;
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
  listenLogs: ListenLog[];
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
