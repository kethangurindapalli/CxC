import { useState } from 'react';
import { userAPI, projectAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function Search() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('projects');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { error } = useToast();
  const handleSearch = async e=>{
    e.preventDefault();
    if(!query.trim()) return;
    setLoading(true);
    try{
      if(type==='users'){
        const r=await userAPI.search({ q: query });
        setResults(r.data.users);
      } else {
        const r=await projectAPI.search({ q: query });
        setResults(r.data.projects);
      }
    }catch{ error('Search failed'); }
    finally{ setLoading(false); }
  };
  return (
    <div className="container" style={{ padding:'2rem 0', maxWidth:'800px' }}>
      <h2 style={{ marginBottom:'1rem' }}>Search</h2>
      <form onSubmit={handleSearch} style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}>
        <select className="form-input" value={type} onChange={e=>setType(e.target.value)} style={{ width:'150px' }}>
          <option value="projects">Projects</option>
          <option value="users">Users</option>
        </select>
        <input className="form-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by topic, technology, name..." style={{ flex:1 }} />
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Searching...':'Search'}</button>
      </form>
      <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'1rem' }}>Private projects are never shown. Connections Only visible if connected.</p>
      <div style={{ display:'grid', gap:'1rem' }}>
        {type==='users' ? results.map(u=>(
          <div key={u._id} className="card" style={{ padding:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600 }}>{u.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight:600 }}>{u.name} {u.anonymousMode && <span className="badge badge-gray">Anon</span>}</div>
                <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>{u.skills?.join(', ')}</div>
              </div>
            </div>
            <Link to={`/users/${u._id}`} className="btn btn-secondary btn-sm">View</Link>
          </div>
        )) : results.map(p=>(
          <Link key={p._id} to={`/projects/${p._id}`} className="card" style={{ padding:'1rem', textDecoration:'none', color:'inherit' }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span className="badge badge-primary">{p.category}</span><span className="badge badge-gray">{p.visibility}</span></div>
            <h4 style={{ margin:'0.5rem 0' }}>{p.title}</h4>
            <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>{p.description?.slice(0,120)}</p>
            <div style={{ marginTop:'0.5rem', display:'flex', gap:'0.3rem', flexWrap:'wrap' }}>{p.technologies?.map(t=><span key={t} className="tag">{t}</span>)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
