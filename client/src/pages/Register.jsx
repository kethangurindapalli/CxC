import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      success('Registered successfully');
      navigate('/dashboard');
    } catch (err) {
      error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally { setLoading(false); }
  };
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Create account</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Join ProjectConnect</p>
        <div className="form-group"><label className="form-label">Name</label><input className="form-input" name="name" value={form.name} onChange={handleChange} required /></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} required /></div>
        <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} /></div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
