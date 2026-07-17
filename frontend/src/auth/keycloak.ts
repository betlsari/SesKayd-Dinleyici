import Keycloak from "keycloak-js";

// =====================================================================
// Keycloak İstemci (Client) Yapılandırması
// ---------------------------------------------------------------------
// Buradaki üç değer ADMİN KONSOLU YETKİSİ GEREKTİRMEZ — bunlar Keycloak'ı
// yöneten kişi/ekip (genelde backend/.NET veya DevOps ekibi) tarafından
// sana verilmesi gereken PUBLIC istemci bilgileridir:
//
//   VITE_KEYCLOAK_URL       -> Keycloak sunucu adresi
//                              (ör. https://sso.sirket.com)
//   VITE_KEYCLOAK_REALM     -> Realm adı (ör. "ses-kayitlari")
//   VITE_KEYCLOAK_CLIENT_ID -> Bu SPA için tanımlanmış PUBLIC client id
//                              (ör. "ses-kayitlari-frontend")
//
// "Şirket sana Keycloak için bir şifre verdi" dediğin şey muhtemelen
// KENDİ KULLANICI HESABININ şifresi — bunu hiçbir yere YAZMAYACAKSIN.
// Aşağıdaki AuthProvider, kimliksiz kullanıcıyı otomatik olarak
// Keycloak'ın KENDİ barındırdığı login sayfasına yönlendirir; kullanıcı
// adı/şifreni orada girersin. Admin konsolu yetkisine ihtiyaç yoktur.
//
// Bu üç değeri (URL/realm/client id) bulamıyorsan, Keycloak'ı yöneten
// ekipten "SPA için public client bilgilerini" iste — API tarafı zaten
// aynı realm'i kullanacağı için genelde .NET ekibinde de mevcuttur.
// =====================================================================

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL ?? "",
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "",
};

export const isKeycloakConfigured =
  Boolean(keycloakConfig.url) &&
  Boolean(keycloakConfig.realm) &&
  Boolean(keycloakConfig.clientId);

if (!isKeycloakConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "[auth] Keycloak yapılandırması eksik. frontend/.env dosyasına " +
      "VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM ve VITE_KEYCLOAK_CLIENT_ID " +
      "değerlerini ekleyin (örnek için frontend/.env.example dosyasına bakın).",
  );
}

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
