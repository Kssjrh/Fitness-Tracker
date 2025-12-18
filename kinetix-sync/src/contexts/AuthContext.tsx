import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // in cm
  weight?: number; // in kg
  goals?: string[];
  joinDate: string;
  calorieGoal?: number; // Daily calorie target
  proteinGoal?: number; // Daily protein target in grams
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
  fitnessGoal?: 'lose' | 'maintain' | 'gain';
  bmi?: number;
  bmiData?: {
    bmi?: number;
    lastUpdated?: string;
    calorieGoal?: number;
    proteinGoal?: number;
    carbsGoal?: number;
    fatsGoal?: number;
    weeklyWorkoutGoal?: number;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'joinDate'> & { password: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  authToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('fitnessTracker_token');
    if (token) {
      setAuthToken(token);
      apiFetch<{ user: User }>('/api/auth/me', { method: 'GET' }, token)
        .then(async (res) => {
          setUser(res.user);
          setIsAuthenticated(true);
          localStorage.setItem('fitnessTracker_user', JSON.stringify(res.user));
        })
        .catch(() => {
          localStorage.removeItem('fitnessTracker_token');
          localStorage.removeItem('fitnessTracker_user');
          setAuthToken(null);
          setUser(null);
          setIsAuthenticated(false);
        });
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiFetch<{ token: string; user: User }>(
        '/api/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      );
      setAuthToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
      localStorage.setItem('fitnessTracker_token', res.token);
      localStorage.setItem('fitnessTracker_user', JSON.stringify(res.user));
      return true;
    } catch {
      return false;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'joinDate'> & { password: string }): Promise<boolean> => {
    try {
      const res = await apiFetch<{ token: string; user: User }>(
        '/api/auth/register',
        { method: 'POST', body: JSON.stringify(userData) }
      );
      setAuthToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
      localStorage.setItem('fitnessTracker_token', res.token);
      localStorage.setItem('fitnessTracker_user', JSON.stringify(res.user));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
    localStorage.removeItem('fitnessTracker_user');
    localStorage.removeItem('fitnessTracker_token');
  };

  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('fitnessTracker_user', JSON.stringify(updatedUser));
      
      // Update in users list as well
      const users = JSON.parse(localStorage.getItem('fitnessTracker_users') || '[]');
      const userIndex = users.findIndex((u: User) => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...userData };
        localStorage.setItem('fitnessTracker_users', JSON.stringify(users));
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateProfile,
      isAuthenticated,
      authToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};