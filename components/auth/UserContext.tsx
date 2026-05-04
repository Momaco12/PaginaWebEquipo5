"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: 'ADMINISTRADOR' | 'LECTOR';
  fechaAlta: string;
  estadoActivo: boolean;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  isLoading: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to restore user from localStorage on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const updateUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const logout = () => {
    // Clear user data
    updateUser(null);
    // Clear auth token
    import('@/lib/auth').then(({ logout }) => logout());
    // Redirect will be handled by the component using this
  };

  const value = {
    user,
    setUser: updateUser,
    isAdmin: user?.rol === 'ADMINISTRADOR',
    isLoading,
    logout,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    // During SSR/static generation, return a safe default
    return {
      user: null,
      setUser: () => {},
      isAdmin: false,
      isLoading: true,
      logout: () => {},
    };
  }
  return context;
}

// Role-based guard components
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAdmin, isLoading } = useUser();

  // During SSR/static generation, don't render admin-only content
  if (isLoading) {
    return null;
  }

  return isAdmin ? <>{children}</> : <>{fallback}</>;
}

export function RoleGuard({
  roles,
  children,
  fallback = null
}: {
  roles: ('ADMINISTRADOR' | 'LECTOR')[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div className="animate-pulse bg-slate-200 rounded h-4 w-20"></div>;
  }

  if (!user || !roles.includes(user.rol)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}