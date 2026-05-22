import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sf_user") || "null"); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sf_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me").then((r) => {
      setUser(r.data);
      localStorage.setItem("sf_user", JSON.stringify(r.data));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("sf_token", data.token);
    localStorage.setItem("sf_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, username, password) => {
    const { data } = await api.post("/auth/register", { name, username, password });
    localStorage.setItem("sf_token", data.token);
    localStorage.setItem("sf_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("sf_token");
    localStorage.removeItem("sf_user");
    setUser(null);
  };

  const updateUser = (u) => {
    setUser(u);
    localStorage.setItem("sf_user", JSON.stringify(u));
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
