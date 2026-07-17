import type { ListenLog } from "../types/record";

// =====================================================================
// Audit Log Servisi
// ---------------------------------------------------------------------
// "Dinleme Logları" verisinin nereden geldiğini bu dosya soyutluyor.
// Şu an gerçek bir backend olmadığı için, recordId'ye göre deterministik
// mock veri üretip bunu bir API çağrısıymış gibi Promise olarak
// döndürüyoruz (yapay gecikmeyle birlikte).
//
// .NET entegrasyonu hazır olduğunda SADECE bu dosyanın içi değişecek.
// fetchListenLogs'u çağıran bileşenler hiçbir şekilde değiştirilmeyecek.
//
// ÖNEMLİ — BU DOSYA SADECE OKUMA (READ) YAPAR:
//   fetchListenLogs, audit log sisteminden log KAYITLARINI okur. Bu
//   KESİNLİKLE read-only'dir; bu uygulama üzerinden mevcut bir log
//   satırı oluşturulamaz, güncellenemez veya silinemez.
//
//   NOT (revizyon): Önceden burada bir reportListenEvent fonksiyonu da
//   vardı — kullanıcı play'e bastığında frontend'den audit sistemine
//   "dinleme oldu" bildirimi yapıyordu. Bu KALDIRILDI, çünkü:
//     1) Frontend'den gelen bu sinyal güvenilir değildi (kullanıcı
//        isteği engelleyebilir/manipüle edebilir, ya da play'e basıp
//        hemen durdurabilir).
//     2) Backend zaten GERÇEK ses akışını açtığı anda (bkz. backend
//        RecordsController.GetRecordAudio) kimliği doğrulanmış istek
//        bağlamından (kullanıcı/rol/IP/zaman sunucu tarafında üretilir)
//        aynı "Dinleme" kaydını oluşturuyor.
//     3) İki ayrı kaynaktan aynı olayı loglamak audit tablosunda çift
//        satıra ve "hangisi gerçek kayıt?" belirsizliğine yol açıyordu.
//   Artık audit kaydının TEK kaynağı backend'in audio stream endpoint'i.
//   Bu dosya SADECE mevcut logları okumakla sorumlu.
//
// Planlanan gerçek endpoint:
//   GET /api/audit-log/records/{recordId}/listen-logs
// =====================================================================

const MOCK_VIEWERS = [
  { user: "berkay.guler", role: "Yönetici" },
  { user: "zeynep.kaya", role: "Analist" },
  { user: "mehmet.can", role: "Supervisor" },
];

// Bu uygulamada indirme özelliği olmadığı için mock veri SADECE
// "Dinleme" üretir (bkz. dosya başındaki "İndirme NEDEN MOCK VERİDE
// YOK?" notu — CallRecord/AudioRecordingCard tarafında).
const MOCK_ACTIONS: ListenLog["action"][] = ["Dinleme"];

// recordId'den basit, deterministik bir sayısal seed türetiyoruz
// (örn. "rec-12" -> 12) ki her kayıt için tutarlı mock veri üretilsin.
function seedFromRecordId(recordId: string): number {
  return Number(recordId.replace(/\D/g, "")) || 0;
}

function generateMockListenLogs(recordId: string): ListenLog[] {
  const seed = seedFromRecordId(recordId);
  const count = 2 + (seed % 4);

  return Array.from({ length: count }, (_, logIndex) => {
    const viewer = MOCK_VIEWERS[(seed + logIndex) % MOCK_VIEWERS.length];
    const action = MOCK_ACTIONS[(seed + logIndex) % MOCK_ACTIONS.length];

    const day = String(1 + ((seed + logIndex) % 27)).padStart(2, "0");
    const hour = String(9 + ((seed + logIndex * 3) % 10)).padStart(2, "0");
    const minute = String((logIndex * 13 + seed) % 60).padStart(2, "0");
    const second = String((logIndex * 7 + seed) % 60).padStart(2, "0");

    return {
      id: `${recordId}-log-${logIndex}`,
      dateTime: `${day}.07.2026 ${hour}:${minute}:${second}`,
      user: viewer.user,
      role: viewer.role,
      action,
      ipAddress: `192.168.1.${10 + ((seed + logIndex) % 200)}`,
    };
  });
}

/**
 * Bir kaydın dinleme loglarını audit log sisteminden (read-only) getirir.
 *
 * TODO: .NET API hazır olunca aşağıdaki mock bloğunu şununla değiştir:
 *
 *   const response = await fetch(`/api/audit-log/records/${recordId}/listen-logs`);
 *   if (!response.ok) {
 *     throw new Error("Dinleme logları alınamadı");
 *   }
 *   return (await response.json()) as ListenLog[];
 */
export async function fetchListenLogs(recordId: string): Promise<ListenLog[]> {
  // Gerçek bir ağ çağrısını simüle etmek için küçük bir gecikme koyuyoruz.
  await new Promise((resolve) => setTimeout(resolve, 350));
  return generateMockListenLogs(recordId);
}
