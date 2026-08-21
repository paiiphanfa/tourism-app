import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import * as authApi from "../api/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync("token");
      if (stored) {
        setToken(stored);
        try {
          const { user: freshUser } = await authApi.me();
          setUser(freshUser);
        } catch (err) {
          await SecureStore.deleteItemAsync("token");
          setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { token: newToken, user: newUser } = await authApi.login({ email, password });
    await SecureStore.setItemAsync("token", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signUp = useCallback(async (email, password, name) => {
    const { token: newToken, user: newUser } = await authApi.register({ email, password, name });
    await SecureStore.setItemAsync("token", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
