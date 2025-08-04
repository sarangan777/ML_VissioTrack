import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');

    console.log('🔍 AuthContext: Checking stored user:', storedUser ? 'Found' : 'Not found');
    console.log('🔍 AuthContext: Checking token:', token ? 'Found' : 'Not found');

    if (storedUser && token) {
      try {
        const userData: User = JSON.parse(storedUser);

        // Normalize role value (case-insensitive)
        const normalizedRole = userData.role?.toLowerCase();
        userData.role = normalizedRole === 'admin' ? 'admin' : 'user';

        setUser(userData);
        console.log('✅ AuthContext: Restored user:', userData.email, 'Role:', userData.role);
      } catch (error) {
        console.error('❌ Failed to parse user:', error);
        localStorage.clear();
      }
    }

    setIsLoading(false);
  }, []);

  const loginUser = (userData: User, token: string) => {
    const normalizedRole = userData.role?.toLowerCase();
    userData.role = normalizedRole === 'admin' ? 'admin' : 'user';

    console.log('🔐 [AuthContext] Logging in user with data:', userData);
    console.log('📅 [AuthContext] Birth date in user data:', userData.birthDate);
    
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authToken', token);
    localStorage.setItem('role', userData.role);

    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login: loginUser,
        logout: logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
