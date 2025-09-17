import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { hasPermission as checkPermission } from '../lib/permissions';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('smartuniit_token');
    if (token) {
      api.setToken(token);
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { user: profile } = await api.getProfile();
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar_url || profile.avatar,
        phone: profile.phone,
        department: profile.department,
        status: profile.status,
        createdAt: new Date(profile.createdAt || profile.created_at),
        updatedAt: new Date(profile.updatedAt || profile.updated_at),
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
      api.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { token, user: profile } = await api.login(email, password);
      
      api.setToken(token);
      
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar_url || profile.avatar,
        phone: profile.phone,
        department: profile.department,
        status: profile.status,
        createdAt: new Date(profile.createdAt || profile.created_at),
        updatedAt: new Date(profile.updatedAt || profile.updated_at),
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, userData: { name: string; company?: string; phone?: string }) => {
    setIsLoading(true);
    
    try {
      const { token, user: profile } = await api.register(email, password, userData);
      
      api.setToken(token);
      
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar_url,
        phone: profile.phone,
        department: profile.department,
        status: profile.status,
        createdAt: new Date(profile.created_at),
        updatedAt: new Date(profile.updated_at),
      });
      
      toast.success('Account created successfully! Welcome to SmartUniit Task Flow.');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      api.clearToken();
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    const permission = `${resource}:${action}`;
    return checkPermission(user.role, permission);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isLoading,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}