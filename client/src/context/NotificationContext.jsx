import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { notificationAPI } from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { socket, on, connected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await notificationAPI.getNotifications({ limit: 20 });
      setNotifications(r.data.notifications);
      setUnreadCount(r.data.unreadCount);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connected) fetchNotifications();
  }, [connected, fetchNotifications]);

  useEffect(() => {
    if (!socket) return;
    const offNotification = on('notification', (notification) => {
      setNotifications(prev => {
        if (prev.some(n => n._id === notification._id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });
    const offConnectionRequest = on('connectionRequest', () => fetchNotifications());
    const offConnectionResponse = on('connectionResponse', () => fetchNotifications());
    const offConnectionRemoved = on('connectionRemoved', () => fetchNotifications());
    return () => {
      offNotification && offNotification();
      offConnectionRequest && offConnectionRequest();
      offConnectionResponse && offConnectionResponse();
      offConnectionRemoved && offConnectionRemoved();
    };
  }, [socket, on, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      const deleted = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (deleted && !deleted.read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}