import type { UserRole } from "./permissions";

// =====================================================================
// Keycloak realm rollerini uygulama içi rollerle eşliyoruz.
// ---------------------------------------------------------------------
// Token içindeki realm_access.roles dizisi, Keycloak realm'inde
// TANIMLI olan rol adlarını içerir. Bu isimler admin konsolunda
// belirlenir — sen admin konsoluna giremediğin için gerçek isimleri
// şu an bilmiyoruz. Aşağıdaki eşleme bir TAHMİNDİR/iskeledir.
//
// Gerçek realm rol adları netleşince (Keycloak'ı yöneten ekipten
// öğrenerek) SADECE bu dosyadaki ROLE_MAP güncellenecek — başka
// hiçbir dosyaya dokunmaya gerek kalmayacak.
// =====================================================================
const ROLE_MAP: Record<string, UserRole> = {
  yonetici: "Yönetici",
  admin: "Yönetici",
  analist: "Analist",
  supervisor: "Supervisor",
};

/**
 * Keycloak'tan gelen realm rollerinden, uygulamanın anladığı TEK bir
 * role karar verir. Birden fazla eşleşen rol varsa ilk bulunanı
 * kullanır (birden fazla rolün aynı anda atanması normalde beklenmez).
 *
 * Hiçbir rol eşleşmezse `null` döner; çağıran taraf bunu "bilinmeyen rol"
 * olarak ele alıp EN KISITLI davranışı uygulamalıdır (bkz. auth/permissions.ts
 * -> isKnownRole, "izin yok" varsayımı güvenli taraftır).
 */
export function mapKeycloakRolesToAppRole(
  realmRoles: string[],
): UserRole | null {
  for (const rawRole of realmRoles) {
    const normalized = rawRole.trim().toLowerCase();
    if (normalized in ROLE_MAP) {
      return ROLE_MAP[normalized];
    }
  }
  return null;
}
