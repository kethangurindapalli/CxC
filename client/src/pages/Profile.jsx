import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();
  const [form, setForm] = useState({ name: '', bio: '', skills: '', interests: '', availability: 'Available' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({
      name: user.name || '',
      bio: user.bio || '',
      skills: (user.skills||[]).join(', '),
      interests: (user.interests||[]).join(', '),
      availability: user.availability || 'Available'
    });
  }, [user]);

  if (!user) return <LoadingSpinner />;
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        bio: form.bio,
        skills: form.skills.split(',').map(s=>s.trim()).filter(Boolean),
        interests: form.interests.split(',').map(s=>s.trim()).filter(Boolean),
        availability: form.availability
      });
      success('Profile updated');
    } catch (err) { error('Failed to update'); }
    finally { setSaving(false); }
  };

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '1rem' }}>Profile</h2>
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Email: <strong>{user.email}</strong> (private, never shown publicly)</p>
        {user.anonymousMode && <div className="alert alert-info">Anonymous Mode is ON — others see you as Anonymous User</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" name="name" value={form.name} onChange={handleChange} required /></div>
          <div className="form-group"><label className="form-label">Bio</label><textarea className="form-input form-textarea" name="bio" value={form.bio} onChange={handleChange} maxLength={500} placeholder="Tell about yourself" /></div>
          <div className="form-group"><label className="form-label">Skills (comma separated)</label><input className="form-input" name="skills" value={form.skills} onChange={handleChange} placeholder="React, Python, ML" /></div>
          <div className="form-group"><label className="form-label">Interests (comma separated)</label><input className="form-input" name="interests" value={form.interests} onChange={handleChange} placeholder="AI, Web Dev, Design" /></div>
          <div className="form-group"><label className="form-label">Availability</label>
            <select className="form-input" name="availability" value={form.availability} onChange={handleChange}>
              <option>Available</option>
              <option>Sometimes available</option>
              <option>Not available</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
        </form>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <p>Public info: Name (or Anonymous), Skills, Interests, Availability (if visible)</p>
        <p>Private info: Email is never exposed publicly.</p>
      </div>
    </div>
  );
}
