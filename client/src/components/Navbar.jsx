import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const { success } = useToast();
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => { await logout(); success('Logged out'); navigate('/login'); };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <NavLink to="/" style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', fontSize: '1.25rem' }}>CxC <span style={{ fontWeight: 400, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Connect and Collab</span></NavLink>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={toggleTheme} className="btn btn-secondary" title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <NavLink to="/login" className="btn btn-secondary">Login</NavLink>
            <NavLink to="/register" className="btn btn-primary">Register</NavLink>
          </div>
        </div>
      </nav>
    );
  }
  const linkStyle = ({ isActive }) => ({ padding: '0.4rem 0.6rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, background: isActive ? 'var(--primary)' : 'transparent', color: isActive ? 'white' : 'var(--text-primary)', whiteSpace: 'nowrap' });

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'connection_request': return '🤝';
      case 'connection_accepted': return '✅';
      case 'connection_rejected': return '❌';
      case 'message': return '💬';
      case 'project_collaboration_request': return '📋';
      case 'project_join_request': return '📥';
      case 'project_collaboration_accepted': return '🎉';
      case 'project_join_accepted': return '🎉';
      default: return '🔔';
    }
  };

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '64px', gap: '1rem', flexWrap: 'wrap' }}>
        <NavLink to="/dashboard" style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>CxC <span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Connect and Collab</span></NavLink>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap' }}>
          <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/projects" style={linkStyle}>Projects</NavLink>
          <NavLink to="/matches" style={linkStyle}>Matches</NavLink>
          <NavLink to="/connections" style={linkStyle}>Connections</NavLink>
          <NavLink to="/chat" style={linkStyle}>Chat</NavLink>
          <NavLink to="/search" style={linkStyle}>Search</NavLink>
          <NavLink to="/profile" style={linkStyle}>Profile</NavLink>
          <NavLink to="/privacy" style={linkStyle}>Privacy</NavLink>
          <button onClick={toggleTheme} className="btn btn-secondary" style={{ marginLeft: '0.5rem', whiteSpace: 'nowrap' }} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <div className="dropdown" ref={dropdownRef}>
            <button onClick={() => setNotifOpen(!notifOpen)} className="btn btn-secondary" style={{ marginLeft: '0.5rem', whiteSpace: 'nowrap', position: 'relative' }} title="Notifications">
              🔔{unreadCount > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {notifOpen && (
              <div className="dropdown-menu" style={{ minWidth: '320px', maxHeight: '400px', overflowY: 'auto', right: 0 }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Notifications</span>
                  {unreadCount > 0 && <button onClick={markAllAsRead} className="btn btn-secondary btn-sm">Mark all read</button>}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No notifications</div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n._id} onClick={() => { if (!n.read) markAsRead(n._id); }} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'var(--primary-light)', cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.1rem', marginTop: '0.1rem' }}>{getNotificationIcon(n.type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: n.read ? 400 : 600, fontSize: '0.85rem' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', whiteSpace: 'normal' }}>{n.message}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{formatTime(n.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
                {notifications.length > 10 && <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--border)' }}><NavLink to="/notifications" style={{ fontSize: '0.85rem' }}>View all notifications →</NavLink></div>}
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>Logout</button>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{user.name?.charAt(0).toUpperCase()}</div>
        </div>
      </div>
    </nav>
  );
}
