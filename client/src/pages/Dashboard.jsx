import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI, connectionAPI, messageAPI, notificationAPI } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [connections, setConnections] = useState({ pending: [], sent: [], accepted: [] });
  const [conversations, setConversations] = useState([]);
  const { notifications, unreadCount } = useNotifications();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      projectAPI.getMyProjects().then(r => setProjects(r.data.projects)).catch(()=>{}),
      connectionAPI.getConnections().then(r => setConnections(r.data)).catch(()=>{}),
      messageAPI.getConversations().then(r => setConversations(r.data.conversations || [])).catch(()=>{})
    ]).finally(()=>setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const recentChats = conversations.slice(0, 3);
  const pendingCount = connections.pending.length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Dashboard</h2>
        <Link to="/projects/new" className="btn btn-primary">+ New Project</Link>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{projects.length}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Your Projects</div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeProjects}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Active</div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{connections.accepted.length}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Connections</div>
        </div>
        <Link to="/connections" className="card" style={{ padding: '1.25rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: pendingCount > 0 ? 'var(--danger)' : 'inherit' }}>{pendingCount}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Pending Requests</div>
        </Link>
        <Link to="/chat" className="card" style={{ padding: '1.25rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{conversations.length}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Chats</div>
        </Link>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: unreadCount > 0 ? 'var(--danger)' : 'inherit' }}>{unreadCount}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Notifications</div>
        </div>
      </div>

      {/* Pending Requests & Notifications Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {pendingCount > 0 && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Pending Connection Requests ({pendingCount})</h3>
            {connections.pending.slice(0, 3).map(c => (
              <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.sender?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.sender?.skills?.slice(0, 2).join(', ')}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to="/connections" className="btn btn-primary btn-sm">Manage</Link>
                </div>
              </div>
            ))}
            {connections.pending.length > 3 && <Link to="/connections" style={{ fontSize: '0.85rem' }}>View all →</Link>}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Recent Notifications</h3>
            {notifications.slice(0, 4).map(n => (
              <div key={n._id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{n.message?.slice(0, 60)}{n.message?.length > 60 ? '...' : ''}</div>
              </div>
            ))}
          </div>
        )}

        {recentChats.length > 0 && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Recent Chats</h3>
            {recentChats.map(c => (
              <Link key={c.user._id} to={`/chat/${c.user._id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.lastMessage?.message?.slice(0, 40)}{c.lastMessage?.message?.length > 40 ? '...' : ''}</div>
                </div>
                {c.unreadCount > 0 && <span className="badge badge-primary">{c.unreadCount}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Projects Section */}
      <h3 style={{ marginBottom: '1rem' }}>Your Projects</h3>
      {projects.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No projects yet. Create your first project to find matches.</p>
          <Link to="/projects/new" className="btn btn-primary">Create Project</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {projects.slice(0, 6).map(p => (
            <Link key={p._id} to={`/projects/${p._id}`} className="card" style={{ padding: '1.25rem', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="badge badge-primary">{p.category}</span>
                <span className="badge badge-gray">{p.visibility}</span>
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{p.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>{p.technologies?.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}</div>
              {p.currentProblem && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--danger)' }}>Problem: {p.currentProblem.slice(0, 80)}</div>}
            </Link>
          ))}
        </div>
      )}
      <div style={{ marginTop: '1rem' }}><Link to="/projects">View all projects →</Link></div>
    </div>
  );
}
