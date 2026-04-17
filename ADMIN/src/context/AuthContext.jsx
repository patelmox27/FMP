import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "adminToken";
const USER_KEY = "adminUser";

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || null,
  );
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    const syncAuthState = (event) => {
      if (event.key === TOKEN_KEY || event.key === USER_KEY) {
        setToken(localStorage.getItem(TOKEN_KEY) || null);
        setUser(readStoredUser());
      }
    };

    window.addEventListener("storage", syncAuthState);
    return () => window.removeEventListener("storage", syncAuthState);
  }, []);

  const login = (nextToken, userData) => {
    setToken(nextToken || null);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      return typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
    });
  };

  const value = useMemo(() => {
    const isAuthenticated = Boolean(token && user);
    const role = (user?.role || "").toLowerCase();
    return {
      token,
      user,
      role,
      isAdmin: role === "admin",
      isAuthenticated,
      login,
      logout,
      updateUser,
    };
  }, [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
