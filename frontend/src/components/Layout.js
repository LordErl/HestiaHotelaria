import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import NotificationCenter from './NotificationCenter';
import { Loader2 } from 'lucide-react';

const Layout = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Check if current route is a mobile page
  const isMobilePage = location.pathname.includes('/mobile-');

  // Register service worker for push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/hestia/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          <p className="text-[#94A3B8]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Mobile pages render without sidebar
  if (isMobilePage) {
    return (
      <div className="min-h-screen bg-[#0B1120]">
        <main className="p-0" data-testid="main-content">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Sidebar />
      {/* Top notification bar */}
      <div className="fixed top-4 right-8 z-50">
        <NotificationCenter />
      </div>
      <main className="ml-64 p-8 transition-all duration-300" data-testid="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
