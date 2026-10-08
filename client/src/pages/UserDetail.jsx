import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI, connectionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function UserDetail(){
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();
  useEffect(()=>{ userAPI.getById(id).then(r=>setData(r.data)).catch(()=> error('Failed to load')).finally(()=>setLoading(false)); },[id]);
  const handleConnect = async ()=>{ try{ await connectionAPI.sendRequest(id); success('Request sent'); }catch(e){ error(e.response?.data?.message||'Failed'); } };
  if(loading) return <LoadingSpinner />;
  if(!data) return <div className="container">User not found</div>;
  const { user, projects } = data;
  return (
    <div className="container" style={{ padding:'2rem 0', maxWidth:'800px' }}>
      <div className="card" style={{ padding:'1.5rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'var(--primary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', fontWeight:700 }}>{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <h2>{user.name} {user.anonymousMode && <span className="badge badge-gray">Anonymous</span>}</h2>
            <div style={{ color:'var(--text-secondary)' }}>{user.bio || 'No bio'}</div>
            <div style={{ fontSize:'0.85rem', marginTop:'0.25rem' }}>{user.skills?.join(', ')}</div>
            {user.availability && <span className={`badge ${user.availability==='Available'?'badge-success':'badge-warning'}`} style={{ marginTop:'0.25rem' }}>{user.availability}</span>}
          </div>
        </div>
        <div style={{ marginTop:'1rem', display:'flex', gap:'0.5rem' }}>
          <button onClick={handleConnect} className="btn btn-primary">Connect</button>
          <Link to={`/chat/${user._id}`} className="btn btn-secondary">Chat (if connected)</Link>
        </div>
      </div>
      <h3>Projects ({projects.length})</h3>
      {projects.length===0 ? <p style={{ color:'var(--text-secondary)' }}>No public projects</p> : <div style={{ display:'grid', gap:'1rem', marginTop:'1rem' }}>{projects.map(p=>(
        <Link key={p._id} to={`/projects/${p._id}`} className="card" style={{ padding:'1rem', textDecoration:'none', color:'inherit' }}>
          <span className="badge badge-primary">{p.category}</span>
          <h4 style={{ margin:'0.5rem 0' }}>{p.title}</h4>
          <p style={{ fontSize:'0.9rem', color:'var(--text-secondary)' }}>{p.description?.slice(0,150)}</p>
        </Link>
      ))}</div>}
    </div>
  );
}
