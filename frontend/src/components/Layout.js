import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

const Layout = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Check if current route is a mobile page
  const isMobilePage = location.pathname.includes('/mobile-');

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
      <main className="ml-64 p-8 transition-all duration-300" data-testid="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
