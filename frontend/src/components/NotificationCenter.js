import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { 
  Bell, 
  BellRing, 
  BellOff,
  Check,
  Trash2,
  Settings,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import usePushNotifications from '../hooks/usePushNotifications';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NotificationCenter = () => {
  const { token, currentHotel } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe
  } = usePushNotifications(token, currentHotel?.id);

  // Load notifications
  useEffect(() => {
    if (!currentHotel?.id || !token) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_URL}/api/notifications/${currentHotel.id}?limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentHotel?.id, token]);

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/notifications/${currentHotel?.id}/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = () => {
    notifications.forEach(n => {
      if (!n.read) markAsRead(n.id);
    });
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success('Notificações push desativadas');
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success('Notificações push ativadas!');
      } else if (permission === 'denied') {
        toast.error('Permissão negada. Habilite nas configurações do navegador.');
      }
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5"
          data-testid="notification-bell"
        >
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-red-500 text-white text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0 bg-[#151E32] border-white/10"
        align="end"
      >
        {/* Header */}
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-[#F8FAFC]">Notificações</h3>
          <div className="flex items-center gap-2">
            {isSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePushToggle}
                className={`h-7 px-2 ${isSubscribed ? 'text-green-400' : 'text-[#94A3B8]'}`}
                title={isSubscribed ? 'Desativar push' : 'Ativar push'}
              >
                {isSubscribed ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 px-2 text-[#94A3B8] hover:text-[#F8FAFC]"
                title="Marcar todas como lidas"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-[#94A3B8]">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-[#D4AF37]/5' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.read ? 'bg-transparent' : 'bg-[#D4AF37]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F8FAFC] truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-[#94A3B8] line-clamp-2 mt-0.5">
                      {notification.body}
                    </p>
                    <p className="text-xs text-[#475569] mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[#94A3B8] hover:text-[#F8FAFC]"
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
