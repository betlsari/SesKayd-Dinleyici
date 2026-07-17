using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;

namespace SesKayitlariApi.Auth;

/// <summary>
/// Keycloak access token'ındaki "realm_access.roles" claim'ini okuyup,
/// uygulamanın bildiği rollere (Yönetici/Analist/Supervisor) çevirerek
/// standart ClaimTypes.Role claim'i olarak ekler.
///
/// Bu dönüşüm olmadan [Authorize(Roles = "Yönetici")] ve
/// User.IsInRole(...) HİÇBİR ZAMAN true dönmez — çünkü Keycloak rolleri
/// .NET'in varsayılan olarak beklediği claim type'ında (ClaimTypes.Role)
/// gelmez.
///
/// ÖNEMLİ: Aşağıdaki RoleMap, frontend/src/auth/roleMapping.ts içindeki
/// ROLE_MAP ile BİREBİR aynı olmalı. Realm rol adları netleşince İKİ
/// dosya da (bu ve roleMapping.ts) birlikte güncellenmeli.
/// </summary>
public class KeycloakRoleClaimsTransformer : IClaimsTransformation
{
    private static readonly Dictionary<string, string> RoleMap = new()
    {
        ["yonetici"] = "Yönetici",
        ["admin"] = "Yönetici",
        ["analist"] = "Analist",
        ["supervisor"] = "Supervisor",
    };

    // realm_access claim adı Keycloak'ta sabittir, appsettings ile
    // ilgisi yok.
    private const string RealmAccessClaimType = "realm_access";

    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        var identity = principal.Identity as ClaimsIdentity;
        if (identity is null || !identity.IsAuthenticated)
        {
            return Task.FromResult(principal);
        }

        // Bu transformer bir istek içinde birden fazla kez tetiklenebilir
        // (ör. authentication birden fazla kez çalıştırılırsa). Rol
        // claim'ini TEKRAR TEKRAR eklememek için önce kontrol ediyoruz.
        if (identity.HasClaim(c => c.Type == ClaimTypes.Role))
        {
            return Task.FromResult(principal);
        }

        var realmAccessRaw = identity.FindFirst(RealmAccessClaimType)?.Value;
        if (string.IsNullOrWhiteSpace(realmAccessRaw))
        {
            return Task.FromResult(principal);
        }

        List<string> realmRoles;
        try
        {
            using var doc = JsonDocument.Parse(realmAccessRaw);
            if (!doc.RootElement.TryGetProperty("roles", out var rolesElement) ||
                rolesElement.ValueKind != JsonValueKind.Array)
            {
                return Task.FromResult(principal);
            }

            realmRoles = rolesElement
                .EnumerateArray()
                .Select(r => r.GetString())
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => r!)
                .ToList();
        }
        catch (JsonException)
        {
            // realm_access claim'i beklenmedik bir formatta geldi.
            // Sessizce hiçbir rol eklemeden devam ediyoruz — bu durumda
            // kullanıcı "bilinmeyen rol" muamelesi görür (en kısıtlı
            // davranış; frontend'deki isKnownRole mantığıyla tutarlı).
            return Task.FromResult(principal);
        }

        // Birden fazla realm rolü eşleşse bile uygulama TEK bir role
        // karar verir — frontend/src/auth/roleMapping.ts ->
        // mapKeycloakRolesToAppRole ile AYNI davranış: ilk eşleşen
        // kullanılır.
        var appRole = realmRoles
            .Select(r => r.Trim().ToLowerInvariant())
            .Where(RoleMap.ContainsKey)
            .Select(r => RoleMap[r])
            .FirstOrDefault();

        if (appRole is not null)
        {
            identity.AddClaim(new Claim(ClaimTypes.Role, appRole));
        }

        return Task.FromResult(principal);
    }
}