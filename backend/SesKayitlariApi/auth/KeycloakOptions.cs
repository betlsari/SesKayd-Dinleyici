namespace SesKayitlariApi.Auth;

/// <summary>
/// appsettings.json içindeki "Keycloak" bölümüne karşılık gelir.
/// Bu üç değer, frontend/src/auth/keycloak.ts içindeki
/// VITE_KEYCLOAK_URL / VITE_KEYCLOAK_REALM / VITE_KEYCLOAK_CLIENT_ID
/// ile AYNI Keycloak sunucusunu/realm'ini işaret etmelidir — frontend
/// ve backend farklı bir realm'e bakarsa, frontend'de alınan token
/// backend tarafından reddedilir.
///
/// ClientId burada zorunlu değildir (backend JWT doğrulaması genelde
/// sadece issuer + imza kontrolü yapar, audience kontrolü opsiyoneldir)
/// ama ileride audience doğrulaması eklenmek istenirse diye tutuluyor.
/// </summary>
public class KeycloakOptions
{
    public const string SectionName = "Keycloak";

    /// <summary>
    /// Keycloak sunucu adresi, örn. "https://oauthtest.yasar.com.tr/auth".
    /// frontend'deki VITE_KEYCLOAK_URL ile aynı olmalı.
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// Realm adı, örn. "VCARD". frontend'deki VITE_KEYCLOAK_REALM ile
    /// aynı olmalı.
    /// </summary>
    public string Realm { get; set; } = string.Empty;

    /// <summary>
    /// Bu API için Keycloak'ta tanımlanmış client id (ya da audience
    /// olarak kullanılacak değer). frontend'deki SPA client'ından
    /// (VITE_KEYCLOAK_CLIENT_ID) FARKLI bir client olabilir — SPA ve
    /// API genelde Keycloak'ta ayrı client olarak tanımlanır.
    /// </summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>
    /// JWT doğrulaması için kullanılacak issuer/authority adresi.
    /// Keycloak'ta standart format: {Url}/realms/{Realm}
    /// örn. "https://oauthtest.yasar.com.tr/auth/realms/VCARD"
    /// </summary>
    public string Authority => $"{Url.TrimEnd('/')}/realms/{Realm}";
}