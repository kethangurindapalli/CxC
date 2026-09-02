import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchAPI, connectionAPI, projectAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Matches() {
  const { projectId } = useParams();
  const { success, error } = useToast();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myProjects, setMyProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(projectId||'');

  const fetchMatches = async (pid) => {
    setLoading(true);
    try{
      const r = pid ? await matchAPI.getMatchesForProject(pid) : await matchAPI.getMatches();
      setMatches(r.data.matches);
    }catch(e){ error('Failed to load matches'); }
    finally{ setLoading(false); }
  };
  useEffect(()=>{ projectAPI.getMyProjects().then(r=>setMyProjects(r.data.projects||[])).catch(()=>{}); },[]);
  useEffect(()=>{ fetchMatches(selectedProject||projectId); },[projectId, selectedProject]);

  const handleConnect = async (userId)=>{
    try{ await connectionAPI.sendRequest(userId); success('Connection request sent'); }catch(e){ error(e.response?.data?.message||'Failed'); }
  };

  return (
    <div className="container" style={{ padding:'2rem 0' }}>
      <h2 style={{ marginBottom:'1rem' }}>Find Matches</h2>
      {myProjects.length>0 && (
        <div style={{ marginBottom:'1rem', display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.9rem' }}>Filter by project:</span>
          <select className="form-input" style={{ width:'auto' }} value={selectedProject} onChange={e=>setSelectedProject(e.target.value)}>
            <option value="">All my projects</option>
            {myProjects.map(p=> <option key={p._id} value={p._id}>{p.title} ({p.category})</option>)}
          </select>
        </div>
      )}
      {loading ? <LoadingSpinner /> : matches.length===0 ? (
        <div className="card" style={{ padding:'2rem', textAlign:'center' }}>
          <p style={{ color:'var(--text-secondary)' }}>No matches found. Create a project with category, technologies and problem to get matches.</p>
          <Link to="/projects/new" className="btn btn-primary" style={{ marginTop:'1rem' }}>Create Project</Link>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:'1rem' }}>
          {matches.map(m=>(
            <div key={m.user._id + m.project._id} className="card" style={{ padding:'1.25rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                <span style={{ background: m.matchPercentage>=80?'var(--success)': m.matchPercentage>=50?'var(--primary)':'var(--warning)', color:'white', padding:'0.25rem 0.6rem', borderRadius:'9999px', fontWeight:700, fontSize:'0.85rem' }}>{m.matchPercentage}% Match</span>
                {m.user.availability && <span className={`badge ${m.user.availability==='Available'?'badge-success': m.user.availability==='Sometimes available'?'badge-warning':'badge-gray'}`}>{m.user.availability}</span>}
              </div>
              <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', marginBottom:'0.75rem' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'var(--primary)' }}>{m.user.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight:600 }}>{m.user.name} {m.user.anonymousMode && <span className="badge badge-gray">Anonymous</span>}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{m.project.category} • {m.project.status}</div>
                </div>
              </div>
              <h4 style={{ fontSize:'0.95rem', marginBottom:'0.25rem' }}>{m.project.title}</h4>
              {m.project.description && <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{m.project.description}</p>}
              <div style={{ margin:'0.5rem 0', display:'flex', gap:'0.3rem', flexWrap:'wrap' }}>{m.project.technologies?.map(t=><span key={t} className="tag">{t}</span>)}</div>
              <div style={{ margin:'0.5rem 0' }}>
                {m.matchFactors?.map(f=> <div key={f.factor} style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}><strong>{f.factor}:</strong> {f.matches.join(', ')}</div>)}
              </div>
              {m.user.lastActive && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Active: {new Date(m.user.lastActive).toLocaleDateString()}</div>}
              <div style={{ marginTop:'0.75rem', display:'flex', gap:'0.5rem' }}>
                <button onClick={()=>handleConnect(m.user._id)} className="btn btn-primary btn-sm">Connect</button>
                <Link to={`/users/${m.user._id}`} className="btn btn-secondary btn-sm" style={{ textDecoration:'none' }}>View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
