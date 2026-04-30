import React, { createContext, useContext, useEffect, useState } from "react";
import { getMe, logout as apiLogout } from "../api";

interface User {
  email: string;
  name: string;
  picture: string;
  auth_enabled: boolean;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({ user: null, loading: true, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
