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
// fetchListenLogs / reportListenEvent'i çağıran bileşenler
// hiçbir şekilde değiştirilmeyecek.
//
// ÖNEMLİ AYRIM — READ vs. EVENT REPORTING:
//   - fetchListenLogs: audit log sisteminden log KAYITLARINI okur.
//     Bu KESİNLİKLE read-only'dir; bu uygulama üzerinden mevcut bir
//     log satırı oluşturulamaz, güncellenemez veya silinemez (buraya
//     doğrudan create/update/delete fonksiyonu eklenmemeli).
//   - reportListenEvent: bu, log'u DOĞRUDAN yazmaz. Sadece "az önce
//     şu kullanıcı şu kaydı dinledi/indirdi" bilgisini audit sistemine
//     BİLDİRİR; log satırını oluşturmak/imzalamak (kullanıcı IP'si,
//     zaman damgası, rol bilgisi gibi güvenilir alanlarla) tamamen
//     backend'in sorumluluğundadır. Frontend sahte bir log satırı
//     oluşturmaz, sadece "bu olay oldu" der.
//
// Planlanan gerçek endpoint'ler:
//   GET  /api/audit-log/records/{recordId}/listen-logs
//   POST /api/audit-log/records/{recordId}/events
// =====================================================================

const MOCK_VIEWERS = [
  { user: "berkay.guler", role: "Yönetici" },
  { user: "zeynep.kaya", role: "Analist" },
  { user: "mehmet.can", role: "Supervisor" },
];

const MOCK_ACTIONS: ListenLog["action"][] = ["Dinleme", "İndirme"];

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

export type ListenEventAction = "Dinleme" | "İndirme";

/**
 * Kullanıcı bir kaydı dinlemeye başladığında veya indirdiğinde bu olayı
 * audit log sistemine bildirir. Bu fonksiyon bir log SATIRI OLUŞTURMAZ;
 * sadece backend'e "şu olay oldu" der. Gerçek log satırı (zaman damgası,
 * IP adresi, kullanıcı/rol bilgisi gibi güvenilir alanlarla) backend
 * tarafında, kimlik doğrulanmış istek bağlamından üretilmelidir —
 * bu yüzden burada IP adresi veya zaman damgası GÖNDERMİYORUZ; bunları
 * client'tan almak sahte/yanıltıcı audit kaydına yol açar.
 *
 * Ağ hatası oluşursa bu, oynatma/indirme deneyimini KESMEMELİDİR — bu
 * yüzden hata sessizce yutulur (en fazla konsola loglanır). Bir audit
 * bildirim hatası yüzünden kullanıcının kaydı dinleyememesi kabul
 * edilemez bir kullanıcı deneyimi olur.
 *
 * TODO: .NET API hazır olunca aşağıdaki mock bloğunu şununla değiştir:
 *
 *   const response = await fetch(`/api/audit-log/records/${recordId}/events`, {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ action }),
 *   });
 *   if (!response.ok) {
 *     throw new Error("Dinleme olayı bildirilemedi");
 *   }
 */
export async function reportListenEvent(
  recordId: string,
  action: ListenEventAction,
): Promise<void> {
  try {
    // Gerçek bir ağ çağrısını simüle etmek için küçük bir gecikme koyuyoruz.
    await new Promise((resolve) => setTimeout(resolve, 150));
    // eslint-disable-next-line no-console
    console.log(`[audit] ${action} olayı bildirildi -> recordId=${recordId}`);
  } catch (error) {
    // Bildirim başarısız olsa bile kullanıcı deneyimini bozmuyoruz.
    // eslint-disable-next-line no-console
    console.error(
      "Dinleme/indirme olayı audit sistemine bildirilemedi:",
      error,
    );
  }
}
