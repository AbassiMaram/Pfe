"use client";

import { createContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isAuthPage = ["/login", "/register"].includes(pathname);

    if (isAuthPage) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    const userDataString = localStorage.getItem("user");

    if (!token || !userDataString || userDataString === "undefined") {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(userDataString);
      if (userData && userData.role && ["client", "marchand", "admin"].includes(userData.role)) {
        setUser({ ...userData, token });
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    } catch (error) {
      console.error("Erreur lors du parsing de userData :", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  const login = (token, userData) => {
    if (!token || !userData || !userData.role || !["client", "marchand", "admin"].includes(userData.role)) {
      console.error("login - Données invalides :", { token, userData });
      return;
    }
    const updatedUserData = { ...userData, token };
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(updatedUserData));
    setUser(updatedUserData);
    const redirectPath =
      userData.role === "admin" ? "/admin" :
      userData.role === "marchand" ? "/merchant-dashboard" :
      "/dashboard";
    console.log("Redirection vers:", redirectPath); // Log pour débogage
    router.push(redirectPath);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl">Chargement...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};