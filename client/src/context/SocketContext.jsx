import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) { socketRef.current.close(); socketRef.current = null; setSocket(null); setConnected(false); }
      return;
    }
    const token = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api','') || window.location.origin;
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    // fallback to localhost:5000 if dev and origin doesn't serve socket
    newSocket.on('connect', () => { setConnected(true); socketRef.current = newSocket; });
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('connect_error', (err) => console.error('Socket error', err.message));
    setSocket(newSocket);
    socketRef.current = newSocket;
    return () => { newSocket.close(); };
  }, [user]);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) socketRef.current.emit(event, data);
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current.off(event, callback);
    }
    return () => {};
  }, [socket]);

  const off = useCallback((event, callback) => {
    if (socketRef.current) socketRef.current.off(event, callback);
  }, [socket]);

  return <SocketContext.Provider value={{ socket, connected, emit, on, off }}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
}
