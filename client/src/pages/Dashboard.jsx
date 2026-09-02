import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    projectAPI.getMyProjects().then(r => setProjects(r.data.projects)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);
  if (loading) return <LoadingSpinner />;
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Dashboard</h2>
        <Link to="/projects/new" className="btn btn-primary">+ New Project</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{projects.length}</div><div style={{ color: 'var(--text-secondary)' }}>Your Projects</div></div>
        <div className="card" style={{ padding: '1.25rem' }}><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{projects.filter(p=>p.status==='Active').length}</div><div style={{ color: 'var(--text-secondary)' }}>Active</div></div>
        <Link to="/matches" className="card" style={{ padding: '1.25rem', textDecoration: 'none', color: 'inherit' }}><div style={{ fontWeight: 600, color: 'var(--primary)' }}>Find Matches →</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Discover similar people</div></Link>
        <Link to="/connections" className="card" style={{ padding: '1.25rem', textDecoration: 'none', color: 'inherit' }}><div style={{ fontWeight: 600, color: 'var(--primary)' }}>Connections →</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage requests</div></Link>
      </div>
      {projects.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No projects yet. Create your first project to find matches.</p>
          <Link to="/projects/new" className="btn btn-primary">Create Project</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {projects.slice(0,6).map(p => (
            <Link key={p._id} to={`/projects/${p._id}`} className="card" style={{ padding: '1.25rem', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="badge badge-primary">{p.category}</span>
                <span className="badge badge-gray">{p.visibility}</span>
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{p.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>{p.technologies?.slice(0,3).map(t=><span key={t} className="tag">{t}</span>)}</div>
              {p.currentProblem && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--danger)' }}>Problem: {p.currentProblem.slice(0,80)}</div>}
            </Link>
          ))}
        </div>
      )}
      <div style={{ marginTop: '1rem' }}><Link to="/projects">View all projects →</Link></div>
    </div>
  );
}
