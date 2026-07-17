import { useEffect, useRef, useState, type ReactNode } from "react";
import keycloak, { isKeycloakConfigured } from "./keycloak";
import { mapKeycloakRolesToAppRole } from "./roleMapping";
import { AuthContext, type AuthUser } from "./AuthContext";
import "./AuthProvider.css";

// NOT: useAuth hook'u, AuthContext ve AuthUser/AuthContextValue tipleri
// artık ./AuthContext dosyasında. Bu dosya react-refresh/only-export-components
// kuralı gereği SADECE component export etmeli (AuthProvider).

type InitStatus = "initializing" | "ready" | "error";

// Token'ın süresi dolmadan kaç saniye önce yenileme denemesi yapılacağı.
const TOKEN_REFRESH_MARGIN_SECONDS = 30;
// Token yenileme kontrolünün ne sıklıkla çalıştırılacağı (ms).
const TOKEN_REFRESH_INTERVAL_MS = 15000;

export function AuthProvider({ children }: { children: ReactNode }) {
  // isKeycloakConfigured değeri sabittir (modül yüklenirken bir kez
  // hesaplanır), bu yüzden başlangıç durumunu effect içinde senkron
  // setState ile değil, doğrudan lazy initializer ile belirliyoruz
  // (react-hooks/set-state-in-effect kuralını ihlal etmemek için).
  const [status, setStatus] = useState<InitStatus>(() =>
    isKeycloakConfigured ? "initializing" : "error",
  );
  const [authValue, setAuthValue] = useState<{
    user: AuthUser | null;
    token: string | undefined;
  }>({ user: null, token: undefined });

  // React StrictMode geliştirme modunda effect'leri iki kez çalıştırır;
  // keycloak.init() ikinci kez çağrılırsa hata fırlatır. Bu ref, init'in
  // yalnızca bir kez tetiklenmesini garanti eder.
  const initStarted = useRef(false);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    // Yapılandırma eksikse başlangıç durumu zaten useState lazy
    // initializer içinde "error" olarak ayarlandı; burada TEKRAR
    // senkron setState çağırmıyoruz, sadece effect'ten çıkıyoruz.
    if (!isKeycloakConfigured) {
      return;
    }

    keycloak
      .init({
        // Kimliksiz kullanıcıyı otomatik olarak Keycloak'ın kendi
        // barındırdığı login sayfasına yönlendirir. Kullanıcı adı/şifre
        // orada girilir; bu proje hiçbir zaman şifreyi kendi elleriyle
        // görmez/taşımaz.
        onLoad: "login-required",
        pkceMethod: "S256",
        checkLoginIframe: false,
        silentCheckSsoRedirectUri:
          window.location.origin + "/silent-check-sso.html",
      })
      .then((authenticated: boolean) => {
        if (!authenticated) {
          // onLoad: "login-required" zaten kimliksiz kullanıcıyı
          // Keycloak'a yönlendirir; buraya "false" ile düşülmesi normal
          // akışta beklenmez — beklenmedik bir durum olarak ele alıyoruz.
          setStatus("error");
          return;
        }

        // keycloak-js'in TS tipleri preferred_username/email gibi
        // standart OIDC claim'lerini içermeyebiliyor; token'ı esnek bir
        // şekilde okuyoruz.
        const parsed = keycloak.tokenParsed as
          | (Record<string, unknown> & {
              realm_access?: { roles?: string[] };
            })
          | undefined;

        const roles = parsed?.realm_access?.roles ?? [];

        setAuthValue({
          user: {
            username:
              (parsed?.preferred_username as string | undefined) ??
              (parsed?.sub as string | undefined) ??
              "bilinmeyen-kullanici",
            email: parsed?.email as string | undefined,
            role: mapKeycloakRolesToAppRole(roles),
          },
          token: keycloak.token,
        });
        setStatus("ready");
      })
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error("[auth] Keycloak başlatılamadı:", error);
        setStatus("error");
      });

    const refreshInterval = setInterval(() => {
      keycloak.updateToken(TOKEN_REFRESH_MARGIN_SECONDS).catch(() => {
        // Token yenilenemedi (ör. oturumun süresi tamamen doldu) —
        // kullanıcıyı tekrar login akışına yönlendiriyoruz.
        keycloak.login();
      });
    }, TOKEN_REFRESH_INTERVAL_MS);

    return () => clearInterval(refreshInterval);
  }, []);

  function logout() {
    keycloak.logout({ redirectUri: window.location.origin });
  }

  if (status === "initializing") {
    return <AuthStatusScreen kind="loading" />;
  }

  if (status === "error") {
    return <AuthStatusScreen kind="error" />;
  }

  return (
    <AuthContext.Provider
      value={{ user: authValue.user, token: authValue.token, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Bu component export EDİLMİYOR (dosya dışına çıkmıyor) — sadece
// AuthProvider içinde kullanılıyor, bu yüzden react-refresh kuralını
// ihlal etmiyor.
function AuthStatusScreen({ kind }: { kind: "loading" | "error" }) {
  return (
    <div className="auth-status-screen">
      {kind === "loading" ? (
        <>
          <div className="auth-status-spinner" aria-hidden="true" />
          <p>Kimlik doğrulanıyor…</p>
        </>
      ) : (
        <>
          <p className="auth-status-title">Giriş yapılamadı</p>
          <p className="auth-status-desc">
            Keycloak bağlantısı kurulamadı. <code>frontend/.env</code>{" "}
            dosyasındaki <code>VITE_KEYCLOAK_*</code> değerlerini kontrol edin
            ya da sistem yöneticinizle iletişime geçin.
          </p>
          <button
            type="button"
            className="auth-status-retry"
            onClick={() => window.location.reload()}
          >
            Tekrar dene
          </button>
        </>
      )}
    </div>
  );
}
