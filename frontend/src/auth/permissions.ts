// =====================================================================
// Merkezi Yetkilendirme (Rol Bazlı) Tanımları
// ---------------------------------------------------------------------
// Bu dosya, uygulamadaki TÜM rol bazlı izin kontrollerinin tek kaynağı
// olması için var. Amaç: "bu kullanıcı silebilir mi", "bu menüyü görebilir
// mi", "bu sayfaya girebilir mi" gibi kontrollerin component'lere serpiştirilip
// birbirinden bağımsız, tutarsız şekilde tekrar tekrar yazılmasını önlemek.
//
// ÖNEMLİ — BU KATMANIN SINIRLARI:
// Burdaki kontroller SADECE arayüzü (UI) role göre şekillendirir; GERÇEK
// bir güvenlik sınırı DEĞİLDİR. Kararlı bir kullanıcı client-side state'i
// (örn. mock currentUser.role) değiştirip bu kontrolleri atlatabilir.
// Gerçek yetkilendirme, Keycloak entegrasyonu sonrası backend'in HER
// istekte JWT/claim doğrulaması yapmasıyla sağlanmalıdır. Bu dosya,
// backend hazır olana kadar mock bir "rol" alanına göre UI'ı tutarlı
// tutmak için bir ARA ÇÖZÜMdür.
//
// TODO (.NET + Keycloak entegrasyonu hazır olunca):
//   - `role: string` yerine Keycloak token'ından gelen gerçek realm/client
//     rolleri veya izin (claim) listesi kullanılacak.
//   - Bu dosyadaki fonksiyonların içi, token'daki claim'leri okuyacak
//     şekilde değişecek; fonksiyon İMZALARI (canDeleteRecords(role) vb.)
//     mümkün olduğunca aynı kalacak ki çağıran component'ler değişmesin.
// =====================================================================

export type UserRole = "Yönetici" | "Analist" | "Supervisor";

// Bilinmeyen/boş bir rol gelirse (örn. henüz login olmamış, ya da
// backend'den beklenmeyen bir rol string'i gelirse) varsayılan olarak
// EN KISITLI davranışı seçiyoruz — "izin yok" varsayımı güvenli taraftır.
function isKnownRole(role: string): role is UserRole {
  return role === "Yönetici" || role === "Analist" || role === "Supervisor";
}

// ---------------------------------------------------------------------
// Kayıt silme izni
// ---------------------------------------------------------------------
const DELETE_RECORDS_ALLOWED_ROLES: UserRole[] = ["Yönetici"];

export function canDeleteRecords(role: string): boolean {
  if (!isKnownRole(role)) return false;
  return DELETE_RECORDS_ALLOWED_ROLES.includes(role);
}

// ---------------------------------------------------------------------
// Menü / sayfa erişim izinleri
// ---------------------------------------------------------------------
// Menü öğesi bazında hangi rollerin görebileceğini burada tanımlıyoruz.
// path -> izinli roller. Burada OLMAYAN bir path (örn. "/kayitlar")
// herkese açık kabul edilir (allowedRolesForPath boş dizi döner).
const RESTRICTED_PATH_ROLES: Record<string, UserRole[]> = {
  "/kullanicilar": ["Yönetici"],
  "/roller": ["Yönetici"],
  "/sirketler": ["Yönetici"],
  "/audit-log": ["Yönetici", "Supervisor"],
  "/api-entegrasyonlari": ["Yönetici"],
  "/ayarlar": ["Yönetici"],
};

// Bir path için izinli rolleri döner. Kısıtlama tanımlı değilse
// boş dizi döner ("herkese açık" anlamına gelir — bkz. canAccessPath).
export function allowedRolesForPath(path: string): UserRole[] {
  return RESTRICTED_PATH_ROLES[path] ?? [];
}

export function canAccessPath(path: string, role: string): boolean {
  const allowedRoles = allowedRolesForPath(path);
  // Kısıtlama tanımlanmamışsa (örn. "/kayitlar") herkese açıktır.
  if (allowedRoles.length === 0) return true;
  if (!isKnownRole(role)) return false;
  return allowedRoles.includes(role);
}
