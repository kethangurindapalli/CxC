import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectAPI } from '../services/api';
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
  useEffect(()=>{ projectAPI.getById(id).then(r=>setProject(r.data.project)).catch(e=> error(e.response?.data?.message||'Failed to load')).finally(()=>setLoading(false)); },[id]);
  const handleDelete = async ()=>{
    if(!confirm('Delete project?')) return;
    try{ await projectAPI.delete(id); success('Deleted'); navigate('/projects'); }catch{ error('Delete failed'); }
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
          <div style={{ marginTop:'1rem', display:'flex', gap:'0.5rem' }}>
            <Link to={`/projects/${project._id}/edit`} className="btn btn-secondary">Edit</Link>
            <button onClick={handleDelete} className="btn btn-danger">Delete</button>
            <Link to={`/matches/${project._id}`} className="btn btn-primary">Find Matches for this project</Link>
          </div>
        ) : (
          <div style={{ marginTop:'1rem' }}>
            <Link to="/matches" className="btn btn-primary">Find Similar People</Link>
            <Link to={`/chat/${project.owner?._id}`} className="btn btn-secondary" style={{ marginLeft:'0.5rem' }}>View Owner</Link>
          </div>
        )}
      </div>
    </div>
  );
}
