import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { 
  Crown, 
  LayoutDashboard, 
  CalendarDays, 
  BedDouble, 
  Users, 
  LogIn, 
  LogOut as LogOutIcon,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hotel,
  ClipboardList,
  Sparkles,
  CreditCard
} from 'lucide-react';

const Sidebar = () => {
  const { user, currentHotel, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/reservations', icon: CalendarDays, label: 'Reservas' },
    { to: '/rooms', icon: BedDouble, label: 'Quartos' },
    { to: '/guests', icon: Users, label: 'Hóspedes' },
    { to: '/check-in-out', icon: LogIn, label: 'Check-in/Out' },
    { to: '/housekeeping', icon: ClipboardList, label: 'Housekeeping' },
    { to: '/chat', icon: MessageSquare, label: 'Assistente IA' },
    { to: '/payment-settings', icon: CreditCard, label: 'Pagamentos' },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-[#151E32]/80 backdrop-blur-xl border-r border-white/5 
        transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#D4AF37]" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-display text-xl font-bold text-[#F8FAFC]">Hestia</h1>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">Hotel Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Current Hotel */}
      {currentHotel && !collapsed && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-[#94A3B8]">
            <Hotel className="w-4 h-4" />
            <span className="text-xs truncate">{currentHotel.name}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20' 
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
              }
              ${collapsed ? 'justify-center px-2' : ''}
            `}
            data-testid={`nav-${item.label.toLowerCase().replace(/\//g, '-')}`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* AI Badge */}
      {!collapsed && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/10">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs text-[#E8DCC4]">IA Gemini Ativada</span>
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-white/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`w-full justify-start gap-3 hover:bg-white/5 ${collapsed ? 'px-2 justify-center' : ''}`}
              data-testid="user-menu-btn"
            >
              <Avatar className="w-8 h-8 border border-[#D4AF37]/30">
                <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="text-left">
                  <p className="text-sm font-medium text-[#F8FAFC] truncate">{user?.name}</p>
                  <p className="text-xs text-[#94A3B8] capitalize">{user?.role}</p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-[#151E32] border-white/10 text-[#F8FAFC]"
          >
            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer" data-testid="settings-btn">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="hover:bg-red-500/10 text-red-400 cursor-pointer"
              data-testid="logout-btn"
            >
              <LogOutIcon className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#151E32] border border-white/10 
          flex items-center justify-center text-[#94A3B8] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors"
        data-testid="sidebar-toggle"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
};

export default Sidebar;
