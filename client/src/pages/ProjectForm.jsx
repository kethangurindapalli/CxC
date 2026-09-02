import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [form, setForm] = useState({ title:'', description:'', category:'', technologies:'', currentProblem:'', status:'Active', visibility:'Public' });
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if (isEdit) projectAPI.getById(id).then(r=>{
      const p=r.data.project;
      setForm({ title:p.title, description:p.description, category:p.category, technologies:(p.technologies||[]).join(', '), currentProblem:p.currentProblem||'', status:p.status, visibility:p.visibility||'Public' });
    }).catch(()=> error('Failed to load'));
  },[id]);

  const handleChange = e=> setForm({...form, [e.target.name]: e.target.value});
  const handleSubmit = async e=>{
    e.preventDefault();
    setLoading(true);
    const payload={ title:form.title, description:form.description, category:form.category, technologies: form.technologies.split(',').map(s=>s.trim()).filter(Boolean), currentProblem:form.currentProblem, status:form.status, visibility:form.visibility };
    try{
      if(isEdit) await projectAPI.update(id,payload);
      else await projectAPI.create(payload);
      success(isEdit?'Updated':'Created');
      navigate('/projects');
    }catch(err){ error(err.response?.data?.message||'Failed'); }
    finally{ setLoading(false); }
  };

  return (
    <div className="container" style={{ padding:'2rem 0', maxWidth:'600px' }}>
      <h2 style={{ marginBottom:'1rem' }}>{isEdit?'Edit Project':'Create Project'}</h2>
      <form onSubmit={handleSubmit} className="card" style={{ padding:'1.5rem' }}>
        <div className="form-group"><label className="form-label">Title *</label><input className="form-input" name="title" value={form.title} onChange={handleChange} required maxLength={100} /></div>
        <div className="form-group"><label className="form-label">Description *</label><textarea className="form-input form-textarea" name="description" value={form.description} onChange={handleChange} required maxLength={2000} /></div>
        <div className="form-group"><label className="form-label">Category / Topic *</label><input className="form-input" name="category" value={form.category} onChange={handleChange} required placeholder="AI, Web Dev, Computer Vision" /></div>
        <div className="form-group"><label className="form-label">Technologies (comma separated)</label><input className="form-input" name="technologies" value={form.technologies} onChange={handleChange} placeholder="React, Python, TensorFlow" /></div>
        <div className="form-group"><label className="form-label">Current Problem</label><textarea className="form-input" name="currentProblem" value={form.currentProblem} onChange={handleChange} maxLength={1000} placeholder="Low accuracy, deployment issue..." /></div>
        <div style={{ display:'flex', gap:'1rem' }}>
          <div className="form-group" style={{ flex:1 }}><label className="form-label">Status</label><select className="form-input" name="status" value={form.status} onChange={handleChange}><option>Active</option><option>Completed</option><option>Paused</option></select></div>
          <div className="form-group" style={{ flex:1 }}><label className="form-label">Visibility</label><select className="form-input" name="visibility" value={form.visibility} onChange={handleChange}><option>Public</option><option>Connections Only</option><option>Private</option></select></div>
        </div>
        <small style={{ color:'var(--text-secondary)', display:'block', marginBottom:'1rem' }}>Private projects not visible publicly. Connections Only visible to accepted connections.</small>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving...': isEdit?'Update':'Create'}</button>
          <button type="button" className="btn btn-secondary" onClick={()=>navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
