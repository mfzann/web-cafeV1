import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cafeorder_admin_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    fetch('/api/admin/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAdmin(data.admin);
        } else {
          logout();
        }
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token]);

  const login = (authToken, adminData) => {
    localStorage.setItem('cafeorder_admin_token', authToken);
    setToken(authToken);
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('cafeorder_admin_token');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
