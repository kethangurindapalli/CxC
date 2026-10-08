import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { uploadAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { user, updateProfile, refreshUser } = useAuth();
  const { success, error } = useToast();
  const [form, setForm] = useState({ name: '', bio: '', skills: '', interests: '', availability: 'Available' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (user) setForm({
      name: user.name || '',
      bio: user.bio || '',
      skills: (user.skills||[]).join(', '),
      interests: (user.interests||[]).join(', '),
      availability: user.availability || 'Available'
    });
    if (user?.profilePicture) setPreview(user.profilePicture);
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

  const handleImageChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { error('Only images allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { error('File too large (max 5MB)'); return; }
    setUploading(true);
    try {
      const r = await uploadAPI.uploadProfilePicture(file);
      setPreview(r.data.profilePicture);
      await refreshUser();
      success('Profile picture updated');
    } catch (err) { error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '1rem' }}>Profile</h2>
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Email: <strong>{user.email}</strong> (private, never shown publicly)</p>
        {user.anonymousMode && <div className="alert alert-info">Anonymous Mode is ON — others see you as Anonymous User</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {preview ? <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>{user.name?.charAt(0).toUpperCase()}</span>}
            <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem', boxShadow: 'var(--shadow)' }}>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} disabled={uploading} />
              📷
            </label>
          </div>
          {uploading && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Uploading...</span>}
        </div>
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
