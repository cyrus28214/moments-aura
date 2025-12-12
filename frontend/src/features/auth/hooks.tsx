import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { get_own_profile, login, type User } from "@/api";
import { useLocalStorage } from "@/lib/use-local-storage";

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  refreshAuth: (token: string | null) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string | null) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useLocalStorage<string | null>('token', null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuthHandler = useCallback(async (token: string | null) => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await get_own_profile(token);
      setUser(data.user);
    } catch (error) {
      console.error("Auth error:", error);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, setToken]);

  useEffect(() => {
    refreshAuthHandler(token);
  }, [refreshAuthHandler, token]);

  const loginHandler = async (email: string, password: string) => {
    try {
      const result = await login({ email, password });
      setToken(result.token);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logoutHandler = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken]);

  const contextValue = useMemo(() => ({
    user,
    token,
    isLoading,
    login: loginHandler,
    logout: logoutHandler,
    refreshAuth: refreshAuthHandler,
    setToken // Expose setToken directly
  }), [user, token, isLoading, loginHandler, logoutHandler, refreshAuthHandler, setToken]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};