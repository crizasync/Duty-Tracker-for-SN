import { createContext, useEffect, useState } from "react";
import {
  login as loginRequest,
  register as registerRequest,
} from "../services/auth";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const loginUser = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);
  };

  const login = async (email, password) => {
    const response = await loginRequest({ email, password });
    const { user: userData, token } = response.data;

    loginUser(userData, token);
    return response.data;
  };

  const register = async (fullName, email, password) => {
    const response = await registerRequest({ fullName, email, password });
    return response.data;
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
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
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
