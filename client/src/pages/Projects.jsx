import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('mine');
  const [allProjects, setAllProjects] = useState([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      projectAPI.getMyProjects().then(r=>setProjects(r.data.projects)).catch(()=>{}),
      projectAPI.getAll().then(r=>setAllProjects(r.data.projects)).catch(()=>{})
    ]).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); }, []);

  if (loading) return <LoadingSpinner />;

  const list = tab==='mine' ? projects : allProjects;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Projects</h2>
        <Link to="/projects/new" className="btn btn-primary">+ New Project</Link>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={()=>setTab('mine')} className={`btn ${tab==='mine'?'btn-primary':'btn-secondary'}`}>My Projects ({projects.length})</button>
        <button onClick={()=>setTab('discover')} className={`btn ${tab==='discover'?'btn-primary':'btn-secondary'}`}>Discover</button>
      </div>
      {list.length===0 ? <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No projects</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {list.map(p=>(
            <Link key={p._id} to={`/projects/${p._id}`} className="card" style={{ padding: '1.25rem', textDecoration:'none', color:'inherit' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <span className="badge badge-primary">{p.category}</span>
                <span className="badge badge-gray">{p.visibility || 'Public'}</span>
              </div>
              <h3 style={{ fontSize:'1rem' }}>{p.title}</h3>
              <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.description}</p>
              <div style={{ marginTop:'0.5rem', display:'flex', gap:'0.3rem', flexWrap:'wrap' }}>{p.technologies?.slice(0,3).map(t=><span key={t} className="tag">{t}</span>)}</div>
              <div style={{ marginTop:'0.5rem', fontSize:'0.8rem', color:'var(--text-muted)' }}>{p.owner?.name ? `by ${p.owner.name}` : ''} • {p.status}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
