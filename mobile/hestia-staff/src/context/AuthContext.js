import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      const storedUser = await SecureStore.getItemAsync('userData');
      
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setHotel(userData.hotels?.[0] || null);
        setIsAuthenticated(true);
        
        // Verify token is still valid
        try {
          const currentUser = await authService.getMe();
          setUser(currentUser);
        } catch (error) {
          // Token expired, logout
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      const { user: userData } = response;
      setUser(userData);
      setHotel(userData.hotels?.[0] || null);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Email ou senha inválidos' 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setHotel(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const switchHotel = (newHotel) => {
    setHotel(newHotel);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        hotel,
        loading,
        isAuthenticated,
        login,
        logout,
        switchHotel,
        hotelId: hotel?.id
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
