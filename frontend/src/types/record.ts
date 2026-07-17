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
}

export interface RecordFilters {
  dateFrom: string;
  dateTo: string;
  callerNumber: string;
  calledNumber: string;

  agent: string;
  username: string;
  callId: string;
}
