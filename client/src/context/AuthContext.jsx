import { createContext, useEffect, useState } from "react";
import {
  login as loginRequest,
  register as registerRequest,
} from "../services/auth";
import { getProfile } from "../services/profile";
import { sessionExpiredEvent } from "../utils/session";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser && localStorage.getItem("token")) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
    const expired = () => setUser(null);
    window.addEventListener(sessionExpiredEvent, expired);
    return () => window.removeEventListener(sessionExpiredEvent, expired);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    let active = true;
    const refreshProfile = async () => {
      try {
        const { data } = await getProfile();
        if (!active || !data.profile) return;

        setUser((current) => {
          if (current?.id !== data.profile.id) return current;
          const updated = { ...current, ...data.profile };
          try {
            localStorage.setItem("user", JSON.stringify(updated));
          } catch {
            // Keep the current profile visible if browser storage is full.
          }
          return updated;
        });
      } catch {
        // Keep the sign-in profile when the profile service is unavailable.
      }
    };

    refreshProfile();
    return () => { active = false; };
  }, [user?.id]);

  const loginUser = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);
  };

  const login = async (username, password) => {
    const response = await loginRequest({ username, password });
    const { user: userData, token } = response.data;

    loginUser(userData, token);
    return response.data;
  };

  const register = async (fullName, username, password) => {
    const response = await registerRequest({ fullName, username, password });
    return response.data;
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  const updateUser = (profile) => {
    const updated = { ...user, ...profile };
    setUser(updated);
    try {
      localStorage.setItem("user", JSON.stringify(updated));
    } catch {
      // Keep the saved profile visible when browser storage is unavailable.
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginUser,
        logoutUser,
        updateUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
