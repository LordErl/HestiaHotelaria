import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReservationsPage from './pages/ReservationsPage';
import RoomsPage from './pages/RoomsPage';
import GuestsPage from './pages/GuestsPage';
import CheckInOutPage from './pages/CheckInOutPage';
import HousekeepingPage from './pages/HousekeepingPage';
import ChatPage from './pages/ChatPage';
import BookingEnginePage from './pages/BookingEnginePage';
import GuestPortalPage from './pages/GuestPortalPage';
import PaymentSettingsPage from './pages/PaymentSettingsPage';
import RevenueManagementPage from './pages/RevenueManagementPage';
import MarketplacePage from './pages/MarketplacePage';
import './App.css';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return null;
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/booking" element={<BookingEnginePage />} />
      <Route path="/guest-portal" element={<GuestPortalPage />} />
      
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      {/* Admin Routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/guests" element={<GuestsPage />} />
        <Route path="/check-in-out" element={<CheckInOutPage />} />
        <Route path="/housekeeping" element={<HousekeepingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/payment-settings" element={<PaymentSettingsPage />} />
        <Route path="/revenue" element={<RevenueManagementPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster 
            theme="dark" 
            position="top-right"
            toastOptions={{
              style: {
                background: '#151E32',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F8FAFC'
              }
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
