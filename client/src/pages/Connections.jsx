import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { connectionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Connections() {
  const { user: me } = useAuth();
  const [data, setData] = useState({ pending:[], sent:[], accepted:[] });
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();
  const load = async ()=>{
    try{ const r=await connectionAPI.getConnections(); setData(r.data); }catch{ error('Failed to load'); } finally{ setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);
  const handleAccept = async (id)=>{ try{ await connectionAPI.respond(id,'accept'); success('Accepted'); load(); }catch(e){ error('Failed'); } };
  const handleReject = async (id)=>{ try{ await connectionAPI.respond(id,'reject'); success('Rejected'); load(); }catch(e){ error('Failed'); } };
  const handleRemove = async (id)=>{ if(!confirm('Remove connection?')) return; try{ await connectionAPI.remove(id); success('Removed'); load(); }catch(e){ error('Failed'); } };
  const handleCancel = async (id)=>{ try{ await connectionAPI.remove(id); success('Cancelled'); load(); }catch(e){ error(e.response?.data?.message||'Failed'); } };
  if(loading) return <LoadingSpinner />;
  const UserCard = ({u})=> (
    <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
      <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--primary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600 }}>{u.name?.charAt(0).toUpperCase()}</div>
      <div>
        <div style={{ fontWeight:600 }}>{u.name} {u.anonymousMode && <span className="badge badge-gray">Anon</span>}</div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{u.availability || ''} {u.lastActive ? '• active '+new Date(u.lastActive).toLocaleDateString():''}</div>
      </div>
    </div>
  );
  const getOther = (c)=>{
    if (!me) return c.receiver || c.sender;
    const senderId = c.sender?._id?.toString() || c.sender?.toString();
    if (senderId === me._id.toString()) return c.receiver;
    return c.sender;
  };
  return (
    <div className="container" style={{ padding:'2rem 0' }}>
      <h2 style={{ marginBottom:'1rem' }}>Connections</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px,1fr))', gap:'1rem' }}>
        <div className="card" style={{ padding:'1.25rem' }}>
          <h3>Pending Requests ({data.pending.length})</h3>
          {data.pending.length===0 ? <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>No pending requests</p> : data.pending.map(c=>(
            <div key={c._id} style={{ border:'1px solid var(--border)', borderRadius:'8px', padding:'0.75rem', marginTop:'0.75rem' }}>
              <UserCard u={c.sender} />
              <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.75rem' }}>
                <button onClick={()=>handleAccept(c._id)} className="btn btn-primary btn-sm">Accept</button>
                <button onClick={()=>handleReject(c._id)} className="btn btn-secondary btn-sm">Reject</button>
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding:'1.25rem' }}>
          <h3>Sent Requests ({data.sent.length})</h3>
          {data.sent.length===0 ? <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>No sent requests</p> : data.sent.map(c=>(
            <div key={c._id} style={{ border:'1px solid var(--border)', borderRadius:'8px', padding:'0.75rem', marginTop:'0.75rem' }}>
              <UserCard u={c.receiver} />
              <button onClick={()=>handleCancel(c._id)} className="btn btn-secondary btn-sm" style={{ marginTop:'0.5rem' }}>Cancel</button>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding:'1.25rem' }}>
          <h3>Connected ({data.accepted.length})</h3>
          {data.accepted.length===0 ? <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>No connections yet</p> : data.accepted.map(c=>{
            const other = getOther(c);
            return (
            <div key={c._id} style={{ border:'1px solid var(--border)', borderRadius:'8px', padding:'0.75rem', marginTop:'0.75rem' }}>
              <UserCard u={other} />
              <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.75rem' }}>
                <Link to={`/chat/${other._id}`} className="btn btn-primary btn-sm" style={{ textDecoration:'none' }}>Chat</Link>
                <button onClick={()=>handleRemove(c._id)} className="btn btn-secondary btn-sm">Remove</button>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}
