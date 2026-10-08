import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function PrivacySettings() {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();
  const [form, setForm] = useState({ anonymousMode: false, activityVisibility: true, availability: 'Available' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (user) setForm({ anonymousMode: !!user.anonymousMode, activityVisibility: user.activityVisibility !== false, availability: user.availability || 'Available' });
  }, [user]);
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      success('Privacy settings saved');
    } catch { error('Failed to save'); }
    finally { setSaving(false); }
  };
  if (!user) return null;
  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '1rem' }}>Privacy Settings</h2>
      <div className="card" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Anonymous Mode</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Show as Anonymous User #1234 — hide identity & detailed project info</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
              <input type="checkbox" checked={form.anonymousMode} onChange={e=>setForm({...form, anonymousMode:e.target.checked})} style={{ opacity:0, width:0, height:0 }} />
              <span style={{ position:'absolute', cursor:'pointer', top:0, left:0, right:0, bottom:0, background: form.anonymousMode?'var(--primary)':'#ccc', borderRadius:'26px', transition:'.2s' }}></span>
              <span style={{ position:'absolute', height:'18px', width:'18px', left: form.anonymousMode?'26px':'4px', bottom:'4px', background:'white', borderRadius:'50%', transition:'.2s' }}></span>
            </label>
          </div>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Activity Visibility</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Allow others to see if you're recently active / availability</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
              <input type="checkbox" checked={form.activityVisibility} onChange={e=>setForm({...form, activityVisibility:e.target.checked})} style={{ opacity:0, width:0, height:0 }} />
              <span style={{ position:'absolute', cursor:'pointer', top:0, left:0, right:0, bottom:0, background: form.activityVisibility?'var(--primary)':'#ccc', borderRadius:'26px', transition:'.2s' }}></span>
              <span style={{ position:'absolute', height:'18px', width:'18px', left: form.activityVisibility?'26px':'4px', bottom:'4px', background:'white', borderRadius:'50%', transition:'.2s' }}></span>
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Availability</label>
            <select className="form-input" value={form.availability} onChange={e=>setForm({...form, availability:e.target.value})}>
              <option>Available</option>
              <option>Sometimes available</option>
              <option>Not available</option>
            </select>
            <small style={{ color: 'var(--text-secondary)' }}>Prioritized in matching. Shows availability indicator for fast response.</small>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Save Settings'}</button>
        </form>
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '8px', fontSize: '0.85rem' }}>
          <strong>Privacy summary:</strong>
          <ul style={{ margin: '0.5rem 0 0 1.25rem' }}>
            <li>Public: Name (or Anonymous), Skills, Interests, General topic</li>
            <li>Private: Email, Detailed project info, Detailed problems, Private chat</li>
            <li>Private projects never appear in public search</li>
            <li>Connections Only projects visible only to accepted connections</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
