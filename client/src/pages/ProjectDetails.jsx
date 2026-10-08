import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectAPI, collaborationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  useEffect(()=>{ projectAPI.getById(id).then(r=>setProject(r.data.project)).catch(e=> error(e.response?.data?.message||'Failed to load')).finally(()=>setLoading(false)); },[id]);

  const handleDelete = async ()=>{
    if(!confirm('Delete project?')) return;
    try{ await projectAPI.delete(id); success('Deleted'); navigate('/projects'); }catch{ error('Delete failed'); }
  };

  const handleJoinRequest = async () => {
    try {
      await collaborationAPI.sendRequest(id, { type: 'join_request', message: joinMessage });
      success('Join request sent');
      setShowJoinModal(false);
      setJoinMessage('');
    } catch (e) { error(e.response?.data?.message || 'Failed to send request'); }
  };

  const handleCollaborationRequest = async () => {
    try {
      await collaborationAPI.sendRequest(id, { type: 'collaboration_request', message: joinMessage });
      success('Collaboration request sent');
      setShowJoinModal(false);
      setJoinMessage('');
    } catch (e) { error(e.response?.data?.message || 'Failed to send request'); }
  };

  const loadRequests = async () => {
    try {
      const r = await collaborationAPI.getRequestsForProject(id);
      setRequests(r.data.requests);
      setShowRequests(true);
    } catch { error('Failed to load requests'); }
  };

  const handleRespond = async (requestId, action) => {
    try {
      await collaborationAPI.respond(requestId, action);
      success(action === 'accept' ? 'Accepted' : 'Rejected');
      loadRequests();
    } catch { error('Failed to respond'); }
  };

  if(loading) return <LoadingSpinner />;
  if(!project) return <div className="container" style={{ padding:'2rem' }}>Project not found</div>;
  const isOwner = project.owner?._id === user._id || project.owner === user._id;
  return (
    <div className="container" style={{ padding:'2rem 0', maxWidth:'800px' }}>
      <Link to="/projects">← Back</Link>
      <div className="card" style={{ padding:'1.5rem', marginTop:'1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem' }}>
          <span className="badge badge-primary">{project.category}</span>
          <span className="badge badge-gray">{project.visibility}</span>
          <span className="badge badge-success">{project.status}</span>
        </div>
        <h2 style={{ marginTop:'1rem' }}>{project.title}</h2>
        <p style={{ color:'var(--text-secondary)', margin:'0.5rem 0' }}>{project.description}</p>
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', margin:'1rem 0' }}>{project.technologies?.map(t=><span key={t} className="tag">{t}</span>)}</div>
        {project.currentProblem && <div className="alert alert-info"><strong>Current Problem:</strong> {project.currentProblem}</div>}
        <div style={{ marginTop:'1rem', fontSize:'0.9rem', color:'var(--text-secondary)' }}>Owner: {project.owner?.name || 'Unknown'} • {new Date(project.createdAt).toLocaleDateString()}</div>
        {isOwner ? (
          <div style={{ marginTop:'1rem', display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            <Link to={`/projects/${project._id}/edit`} className="btn btn-secondary">Edit</Link>
            <button onClick={handleDelete} className="btn btn-danger">Delete</button>
            <Link to={`/matches/${project._id}`} className="btn btn-primary">Find Matches for this project</Link>
            <button onClick={loadRequests} className="btn btn-outline">Requests {requests.length > 0 && `(${requests.length})`}</button>
          </div>
        ) : (
          <div style={{ marginTop:'1rem', display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            <Link to="/matches" className="btn btn-primary">Find Similar People</Link>
            <Link to={`/chat/${project.owner?._id}`} className="btn btn-secondary">View Owner</Link>
            <button onClick={() => setShowJoinModal(true)} className="btn btn-success">Join Project</button>
          </div>
        )}

        {/* Join/Collaboration Request Modal */}
        {showJoinModal && (
          <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Request to Join / Collaborate</h3>
                <button className="modal-close" onClick={() => setShowJoinModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Message (optional)</label>
                  <textarea className="form-input form-textarea" value={joinMessage} onChange={e => setJoinMessage(e.target.value)} maxLength={500} placeholder="Why do you want to join/collaborate?" />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={handleJoinRequest} className="btn btn-success">Send Join Request</button>
                <button onClick={handleCollaborationRequest} className="btn btn-primary">Send Collaboration Request</button>
                <button onClick={() => setShowJoinModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Requests List for Owner */}
        {showRequests && isOwner && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3>Pending Requests ({requests.length})</h3>
            {requests.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No pending requests</p> : requests.map(r => (
              <div key={r._id} className="card" style={{ padding: '1rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{r.user?.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.user?.name} <span className="badge badge-gray">{r.type === 'join_request' ? 'Join' : 'Collaborate'}</span></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.user?.skills?.join(', ')}</div>
                  </div>
                </div>
                {r.message && <p style={{ fontSize: '0.85rem', margin: '0.5rem 0' }}>{r.message}</p>}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button onClick={() => handleRespond(r._id, 'accept')} className="btn btn-primary btn-sm">Accept</button>
                  <button onClick={() => handleRespond(r._id, 'reject')} className="btn btn-secondary btn-sm">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
