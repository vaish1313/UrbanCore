import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { RoleType } from "@/types/urbancore";

// Standard Auth response from backend
interface UserPayload {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  address?: string | null;
  role: RoleType;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserPayload;
}

interface AuthContextType {
  user: UserPayload | null;
  token: string | null;
  login: (data: Record<string, unknown>) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from local storage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("urbancore_token");
    const storedUser = localStorage.getItem("urbancore_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("urbancore_token");
        localStorage.removeItem("urbancore_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: Record<string, unknown>) => {
    try {
      // MOCK LOGIN - Bypass backend, accept any credentials
      console.log("Mock login with data:", data);

      // Create mock user based on input
      const mockUser: UserPayload = {
        id: "mock-user-" + Date.now(),
        email: (data.email as string) || "user@example.com",
        full_name: "Mock User",
        phone: null,
        address: null,
        role: "CITIZEN" as RoleType, // Always login as CITIZEN
      };

      const mockToken = "mock-token-" + Date.now();

      setToken(mockToken);
      setUser(mockUser);
      localStorage.setItem("urbancore_token", mockToken);
      localStorage.setItem("urbancore_user", JSON.stringify(mockUser));

      console.log("Mock login successful:", mockUser);
    } catch (err: unknown) {
      console.error("Mock login error:", err);
      throw err;
    }
  };

  const register = async (data: Record<string, unknown>) => {
    try {
      // MOCK REGISTER - Bypass backend, accept any registration
      console.log("Mock register with data:", data);

      // Create mock user from registration data
      const mockUser: UserPayload = {
        id: "mock-user-" + Date.now(),
        email: (data.email as string) || "user@example.com",
        full_name: (data.full_name as string) || "New User",
        phone: (data.phone as string) || null,
        address: (data.address as string) || null,
        role: (data.role as RoleType) || "CITIZEN",
      };

      const mockToken = "mock-token-" + Date.now();

      setToken(mockToken);
      setUser(mockUser);
      localStorage.setItem("urbancore_token", mockToken);
      localStorage.setItem("urbancore_user", JSON.stringify(mockUser));

      console.log("Mock registration successful:", mockUser);
    } catch (err: unknown) {
      console.error("Mock register error:", err);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("urbancore_token");
    localStorage.removeItem("urbancore_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
