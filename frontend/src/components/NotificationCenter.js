import React, { useState, useEffect, useCallback } from 'react';
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
  CheckCheck,
  Trash2,
  Settings,
  X,
  ShoppingBag,
  Calendar,
  Wrench,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import usePushNotifications from '../hooks/usePushNotifications';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NotificationCenter = () => {
  const { token, currentHotel } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe
  } = usePushNotifications(token, currentHotel?.id);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data || []);
      // Update unread count based on fetched data
      const unread = (response.data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial fetch and polling
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
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

  const getNotificationIcon = (type) => {
    const icons = {
      new_order: ShoppingBag,
      reservation: Calendar,
      maintenance: Wrench,
      alert: AlertCircle,
      message: MessageSquare
    };
    return icons[type] || Bell;
  };

  const getNotificationColor = (type) => {
    const colors = {
      new_order: 'text-emerald-400',
      reservation: 'text-blue-400',
      maintenance: 'text-amber-400',
      alert: 'text-red-400',
      message: 'text-purple-400'
    };
    return colors[type] || 'text-[#D4AF37]';
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
            <BellRing className="w-5 h-5 text-[#D4AF37]" />
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
        className="w-96 p-0 bg-[#151E32] border-white/10"
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
                <CheckCheck className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-[#94A3B8]">
              <div className="animate-pulse">Carregando...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-[#94A3B8]">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group ${
                    !notification.is_read ? 'bg-[#D4AF37]/5' : ''
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-white/5 ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm font-medium truncate ${!notification.is_read ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-[#94A3B8] line-clamp-2 mt-0.5">
                            {notification.message || notification.body}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-[#475569] hover:text-red-400" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-[#475569]">
                          {formatTime(notification.created_at)}
                        </p>
                        {!notification.is_read && (
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                            <span className="text-xs text-[#D4AF37]">Nova</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
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
