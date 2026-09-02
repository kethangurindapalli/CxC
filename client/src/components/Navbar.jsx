import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();
  const handleLogout = async () => { await logout(); success('Logged out'); navigate('/login'); };
  if (!user) {
    return (
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <NavLink to="/" style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', fontSize: '1.25rem' }}>CxC <span style={{ fontWeight: 400, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Connect and Collab</span></NavLink>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <NavLink to="/login" className="btn btn-secondary">Login</NavLink>
            <NavLink to="/register" className="btn btn-primary">Register</NavLink>
          </div>
        </div>
      </nav>
    );
  }
  const linkStyle = ({ isActive }) => ({ padding: '0.5rem 0.75rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, background: isActive ? 'var(--primary)' : 'transparent', color: isActive ? 'white' : 'var(--text-primary)' });
  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', gap: '1rem', overflowX: 'auto' }}>
        <NavLink to="/dashboard" style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', fontSize: '1.2rem', whiteSpace: 'nowrap' }}>CxC <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Connect and Collab</span></NavLink>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
          <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/projects" style={linkStyle}>Projects</NavLink>
          <NavLink to="/matches" style={linkStyle}>Matches</NavLink>
          <NavLink to="/connections" style={linkStyle}>Connections</NavLink>
          <NavLink to="/chat" style={linkStyle}>Chat</NavLink>
          <NavLink to="/search" style={linkStyle}>Search</NavLink>
          <NavLink to="/profile" style={linkStyle}>Profile</NavLink>
          <NavLink to="/privacy" style={linkStyle}>Privacy</NavLink>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>Logout</button>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{user.name?.charAt(0).toUpperCase()}</div>
        </div>
      </div>
    </nav>
  );
}
