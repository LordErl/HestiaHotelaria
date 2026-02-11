import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hestia_token'));
  const [loading, setLoading] = useState(true);
  const [currentHotel, setCurrentHotel] = useState(null);

  const fetchUser = useCallback(async (authToken) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      
      // Fetch hotels and set current
      const hotelsRes = await axios.get(`${API}/hotels`);
      if (hotelsRes.data.length > 0) {
        setCurrentHotel(hotelsRes.data[0]);
      }
      return true;
    } catch (error) {
      console.error('Auth error:', error);
      // Clear invalid token
      localStorage.removeItem('hestia_token');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      setCurrentHotel(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('hestia_token');
      if (savedToken) {
        await fetchUser(savedToken);
      }
      setLoading(false);
    };
    initAuth();
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('hestia_token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setToken(access_token);
      setUser(userData);
      
      // Fetch hotels
      const hotelsRes = await axios.get(`${API}/hotels`);
      if (hotelsRes.data.length > 0) {
        setCurrentHotel(hotelsRes.data[0]);
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Erro ao fazer login' 
      };
    }
  };

  const register = async (name, email, password, role = 'receptionist') => {
    try {
      const response = await axios.post(`${API}/auth/register`, { 
        name, 
        email, 
        password, 
        role 
      });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('hestia_token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setToken(access_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Erro ao registrar' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('hestia_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setCurrentHotel(null);
  };

  const seedDemoData = async () => {
    try {
      const response = await axios.post(`${API}/seed`);
      // Refresh hotels
      const hotelsRes = await axios.get(`${API}/hotels`);
      if (hotelsRes.data.length > 0) {
        setCurrentHotel(hotelsRes.data[0]);
      }
      return response.data;
    } catch (error) {
      console.error('Seed error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      currentHotel,
      setCurrentHotel,
      login,
      register,
      logout,
      seedDemoData,
      isAuthenticated: !!user && !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
