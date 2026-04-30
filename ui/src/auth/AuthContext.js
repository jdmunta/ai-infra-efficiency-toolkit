import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
import { getMe, logout as apiLogout } from "../api";
const AuthContext = createContext({ user: null, loading: true, logout: async () => { } });
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
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
    return _jsx(AuthContext.Provider, { value: { user, loading, logout }, children: children });
}
export function useAuth() {
    return useContext(AuthContext);
}
