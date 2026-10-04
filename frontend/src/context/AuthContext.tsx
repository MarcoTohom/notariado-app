import React, { createContext, useContext, useEffect, useState } from "react";
import { UserSession, RoleType } from "../types";
import { authService } from "../services/api";

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  loading: boolean;
  login: (usernameOrEmail: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: RoleType[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("notariado_token"));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const userData = await authService.getMe();
      setUser(userData);
    } catch {
      localStorage.removeItem("notariado_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (usernameOrEmail: string, pass: string) => {
    setLoading(true);
    try {
      const data = await authService.login(usernameOrEmail, pass);
      localStorage.setItem("notariado_token", data.access_token);
      setToken(data.access_token);
      const userData = await authService.getMe();
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("notariado_token");
      setToken(null);
      setUser(null);
    }
  };

  const hasRole = (...roles: RoleType[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};