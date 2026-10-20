import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Admin } from '../types';
import { getMe, logout as apiLogout } from '../api';

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, admin: Admin) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      setToken(storedToken);
      getMe()
        .then((res) => {
          setAdmin(res.data.admin);
        })
        .catch(() => {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_info');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginFn = useCallback((newToken: string, newAdmin: Admin) => {
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_info', JSON.stringify(newAdmin));
    setToken(newToken);
    setAdmin(newAdmin);
  }, []);

  const logoutFn = useCallback(async () => {
    try {
      await apiLogout();
    } catch (_) {}
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isLoading,
        login: loginFn,
        logout: logoutFn,
        isAuthenticated: !!token && !!admin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
