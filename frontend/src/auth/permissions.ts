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

const RESTRICTED_PATH_ROLES: Record<string, UserRole[]> = {
  "/kullanicilar": ["Yönetici"],
  "/roller": ["Yönetici"],
  "/sirketler": ["Yönetici"],
  "/audit-log": ["Yönetici", "Supervisor"],
  "/api-entegrasyonlari": ["Yönetici"],
  "/ayarlar": ["Yönetici"],
};

export function allowedRolesForPath(path: string): UserRole[] {
  return RESTRICTED_PATH_ROLES[path] ?? [];
}

export function canAccessPath(path: string, role: string): boolean {
  const allowedRoles = allowedRolesForPath(path);

  if (allowedRoles.length === 0) return true;
  if (!isKnownRole(role)) return false;
  return allowedRoles.includes(role);
}
