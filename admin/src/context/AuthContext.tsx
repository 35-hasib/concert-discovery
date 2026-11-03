import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api, getToken, setToken, UNAUTHORIZED_EVENT } from "../lib/api";
import type { AdminUser } from "../lib/types";

const USER_KEY = "cd_admin_user";

type AuthValue = {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function readSavedUser(): AdminUser | null {
  try {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? (JSON.parse(saved) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(readSavedUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (!getToken()) {
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const data = await api<{ admin: AdminUser }>("/auth/me");
        if (cancelled) return;
        setUser(data.admin);
        localStorage.setItem(USER_KEY, JSON.stringify(data.admin));
      } catch {
        if (cancelled) return;
        setToken(null);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void checkSession();

    function onUnauthorized() {
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setLoading(false);
    }

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, []);

  async function login(email: string, password: string) {
    const data = await api<{ token: string; admin: AdminUser }>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.admin));
    setUser(data.admin);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
