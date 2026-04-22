import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, getProfile } from '../services/api';

interface User {
  id: number;
  username: string;
  role: string;
  full_name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {}
      setLoading(false);
    })();

    const authListener = DeviceEventEmitter.addListener('auth_error', () => {
      logout();
    });

    return () => authListener.remove();
  }, []);

  const login = async (username: string, password: string) => {
    const data = await apiLogin(username, password);
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const data = await getProfile();
      setUser(data.user);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
