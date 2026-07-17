namespace SesKayitlariApi.Auth;

/// <summary>
/// Uygulama içi rol tanımı. frontend/src/auth/permissions.ts içindeki
/// UserRole tipiyle BİREBİR aynı üç değeri içerir — iki taraf da aynı
/// rol adlarını kullanmalı, aksi halde frontend'deki yetki kontrolleri
/// (canDeleteRecords, canAccessPath) ile backend'deki yetkilendirme
/// birbirinden sapar.
///
/// Bu üçünün DIŞINDA bir rol (bilinmeyen/atanmamış), RoleMapping
/// tarafından null olarak ele alınır ve EN KISITLI davranış uygulanır
/// (bkz. RoleMapping.cs).
/// </summary>
public enum UserRole
{
    Yonetici,
    Analist,
    Supervisor,
}