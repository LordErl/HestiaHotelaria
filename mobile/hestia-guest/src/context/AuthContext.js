import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [guest, setGuest] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedGuest = await SecureStore.getItemAsync('guestData');
      const storedReservation = await SecureStore.getItemAsync('reservationData');
      
      if (storedGuest && storedReservation) {
        setGuest(JSON.parse(storedGuest));
        setReservation(JSON.parse(storedReservation));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginWithCode = async (code) => {
    try {
      const response = await authService.loginWithCode(code);
      
      if (response.success) {
        const { guest: guestData, reservation: reservationData } = response;
        
        await SecureStore.setItemAsync('guestData', JSON.stringify(guestData));
        await SecureStore.setItemAsync('reservationData', JSON.stringify(reservationData));
        
        setGuest(guestData);
        setReservation(reservationData);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Código inválido' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Erro ao acessar. Verifique o código.' 
      };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('guestData');
      await SecureStore.deleteItemAsync('reservationData');
      setGuest(null);
      setReservation(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateReservation = (updatedReservation) => {
    setReservation(updatedReservation);
    SecureStore.setItemAsync('reservationData', JSON.stringify(updatedReservation));
  };

  return (
    <AuthContext.Provider
      value={{
        guest,
        reservation,
        loading,
        isAuthenticated,
        loginWithCode,
        logout,
        updateReservation,
        hotelId: reservation?.hotel_id
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
