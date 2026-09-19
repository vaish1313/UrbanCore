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

const API_BASE_URL = "http://localhost:8000/api/v1";

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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to login");
    }

    const result: AuthResponse = await response.json();
    setToken(result.access_token);
    setUser(result.user);
    localStorage.setItem("urbancore_token", result.access_token);
    localStorage.setItem("urbancore_user", JSON.stringify(result.user));
  };

  const register = async (data: Record<string, unknown>) => {
    // Send register request to backend
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to register account");
    }

    const result: AuthResponse = await response.json();
    setToken(result.access_token);
    setUser(result.user);
    localStorage.setItem("urbancore_token", result.access_token);
    localStorage.setItem("urbancore_user", JSON.stringify(result.user));
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
