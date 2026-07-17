import { createContext, useContext } from "react";
import type { UserRole } from "./permissions";

// Bu dosya SADECE component olmayan şeyleri (context, hook, tipler) export
// eder. AuthProvider.tsx ise SADECE component export eder. Bu ayrım
// react-refresh/only-export-components kuralı için gerekli — bir dosya
// hem component hem başka şeyler export ederse Fast Refresh (hot reload)
// o dosya için düzgün çalışamaz.

export interface AuthUser {
  username: string;
  email?: string;
  // Keycloak'taki realm rolü, uygulamanın bildiği bir role eşleşmediyse
  // null olur — bu durumda çağıran taraf EN KISITLI davranışı uygulamalı
  // (bkz. auth/permissions.ts).
  role: UserRole | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | undefined;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  }
  return ctx;
}
