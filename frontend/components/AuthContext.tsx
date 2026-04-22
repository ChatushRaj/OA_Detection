import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/router";

interface UserData {
  id: number;
  username: string;
  role: "doctor" | "patient" | "admin";
  full_name: string;
  email: string;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  loading: boolean;
  login: (tokenOrUsername: string, userOrPassword?: string | UserData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  connectionError: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("oa_token");
    const savedUser = localStorage.getItem("oa_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    // Check backend health with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch("http://localhost:5000/api/health", { signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error("Backend not healthy");
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.error("Backend connection failed:", err);
        setConnectionError("Cannot connect to medical server. Please ensure the backend is running.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (tokenOrUsername: string, userOrPassword?: string | UserData) => {
    // If called with (token, userData) — direct login for profile updates
    if (typeof userOrPassword === "object" && userOrPassword !== null) {
      const newToken = tokenOrUsername;
      const userData = userOrPassword as UserData;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem("oa_token", newToken);
      localStorage.setItem("oa_user", JSON.stringify(userData));
      return;
    }

    // Normal login with (username, password)
    const username = tokenOrUsername;
    const password = userOrPassword as string;
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("oa_token", data.token);
    localStorage.setItem("oa_user", JSON.stringify(data.user));

    // Redirect to role-specific dashboard
    const dashboardMap: Record<string, string> = {
      doctor: "/doctor",
      patient: "/patient",
      admin: "/admin",
    };
    router.push(dashboardMap[data.user.role] || "/");
  }, [router]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("oa_token");
    localStorage.removeItem("oa_user");
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token, connectionError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function withAuth<P extends object>(Component: React.ComponentType<P>, allowedRoles?: string[]) {
  return function ProtectedRoute(props: P) {
    const { user, loading, isAuthenticated, connectionError } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push("/login");
      }
      if (!loading && isAuthenticated && allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push(`/${user.role}`);
      }
    }, [loading, isAuthenticated, user, router]);

    if (loading || !isAuthenticated) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8fafc", flexDirection: "column", gap: "20px", fontFamily: "'Inter', system-ui, sans-serif" }}>
          <div style={{ color: "#1e293b", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.02em" }}>{connectionError ? "Network Synchronization Error" : "Authorizing Access..."}</div>
          {connectionError && (
            <div style={{ color: "#ef4444", fontSize: "0.95rem", maxWidth: "400px", textAlign: "center", padding: "0 20px", fontWeight: 500, lineHeight: 1.5 }}>
              {connectionError}
            </div>
          )}
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export default AuthContext;
