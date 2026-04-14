import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'sissaude360_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarSessao = () => {
      const storedData = localStorage.getItem(TOKEN_KEY);
      if (storedData) {
        try {
          const { token: storedToken, usuario: storedUser } = JSON.parse(storedData);
          setToken(storedToken);
          setUsuario(storedUser);
        } catch (e) {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setLoading(false);
    };

    carregarSessao();
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, senha });
      const { token: newToken, usuario: newUser } = response.data;

      const sessionData = JSON.stringify({ token: newToken, usuario: newUser });
      localStorage.setItem(TOKEN_KEY, sessionData);

      setToken(newToken);
      setUsuario(newUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao realizar login');
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
