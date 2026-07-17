namespace SesKayitlariApi.Auth;

/// <summary>
/// Keycloak realm rollerini uygulama içi UserRole'e eşler.
///
/// =====================================================================
/// ÖNEMLİ — BU DOSYA frontend/src/auth/roleMapping.ts İLE BİREBİR
/// TUTARLI OLMALI. İki taraf da aynı realm rol adlarını aynı UserRole
/// değerine eşlemeli; aksi halde bir kullanıcı frontend'de "Yönetici"
/// olarak görünürken backend'de farklı bir role (veya hiçbir role)
/// eşlenebilir — bu durum tutarsız/güvensiz yetkilendirmeye yol açar.
///
/// Aşağıdaki eşleme frontend'deki gibi bir TAHMİNDİR/iskeledir — gerçek
/// realm rol adları Keycloak'ı yöneten ekipten öğrenilince, BU DOSYA ve
/// frontend/src/auth/roleMapping.ts AYNI ANDA güncellenmeli. Rol adları
/// netleşene kadar, hiçbir gerçek kullanıcının doğru şekilde
/// yetkilendirilmeyeceğini unutma.
/// =====================================================================
/// </summary>
public static class RoleMapping
{
    // Anahtarlar küçük harfle tutulur; token'dan gelen rol adı
    // karşılaştırılmadan önce ToLowerInvariant() ile normalize edilir
    // (bkz. MapRealmRolesToAppRole). Bu, frontend'deki
    // rawRole.trim().toLowerCase() davranışıyla birebir aynıdır.
    private static readonly Dictionary<string, UserRole> RoleMap = new()
    {
        ["yonetici"] = UserRole.Yonetici,
        ["admin"] = UserRole.Yonetici,
        ["analist"] = UserRole.Analist,
        ["supervisor"] = UserRole.Supervisor,
    };

    /// <summary>
    /// Token'daki realm_access.roles dizisinden, uygulamanın anladığı
    /// TEK bir role karar verir. Birden fazla eşleşen rol varsa ilk
    /// bulunanı kullanır (frontend'deki mapKeycloakRolesToAppRole ile
    /// aynı davranış).
    ///
    /// Hiçbir rol eşleşmezse null döner; çağıran taraf bunu "bilinmeyen
    /// rol" olarak ele alıp EN KISITLI davranışı (yetki yok) uygulamalı.
    /// </summary>
    public static UserRole? MapRealmRolesToAppRole(IEnumerable<string> realmRoles)
    {
        foreach (var rawRole in realmRoles)
        {
            var normalized = rawRole.Trim().ToLowerInvariant();
            if (RoleMap.TryGetValue(normalized, out var appRole))
            {
                return appRole;
            }
        }

        return null;
    }
}