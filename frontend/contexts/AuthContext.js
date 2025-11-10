import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import frontendCache from '../utils/cache';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success(`Welcome back, ${user.name}!`);

      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/pos');
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    frontendCache.clear(); // Clear all cached data on logout
    setUser(null);
    router.push('/login');
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isCashier: user?.role === 'cashier',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

