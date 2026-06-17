import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import rideAPI from '../services/rideAPI';
import chatAPI from '../services/chatAPI';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const ws = useRef(null);

  // Fetch past notifications on login
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const data = await rideAPI.getNotifications();
          setNotifications(data);
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        }
      } else {
        setNotifications([]);
        if (ws.current) {
          ws.current.close();
        }
      }
    };

    fetchNotifications();
  }, [user]);

  // Connect WebSocket notifications
  useEffect(() => {
    if (!user) return;

    const connectWebSocket = () => {
      try {
        const wsUrl = chatAPI.getWebSocketURL('notifications'); // Correctly appends token query parameter
        // wsUrl resolves to e.g. ws://localhost:8000/api/chat/ws/notifications?token=xxx
        ws.current = new WebSocket(wsUrl);

        ws.current.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'notification') {
              const newNotif = payload.data;
              
              // Add to state
              setNotifications((prev) => [newNotif, ...prev]);
              
              // Trigger Toast
              addToast(newNotif.title, newNotif.message, 'info');
            }
          } catch (e) {
            console.error("Error parsing notification WS frame:", e);
          }
        };

        ws.current.onclose = () => {
          // Reconnect with backoff after 5 seconds if still authenticated
          if (user) {
            setTimeout(connectWebSocket, 5000);
          }
        };

        ws.current.onerror = (err) => {
          console.error("Notification WS Error:", err);
          ws.current.close();
        };
      } catch (err) {
        console.error("WS setup failed:", err);
      }
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user]);

  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    
    // Automatically dismiss toast after 5 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 5000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAsRead = async (id) => {
    try {
      await rideAPI.readNotification(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_status: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await rideAPI.readAllNotifications();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_status).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      toasts,
      markAsRead,
      markAllAsRead,
      addToast,
      dismissToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
