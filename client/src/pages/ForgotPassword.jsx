import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: '' });
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(form.email);
      success('If the email exists, a reset link will be sent');
      navigate('/login');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to send reset link');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Forgot Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Enter your email to receive a reset link</p>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} required /></div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>Remember password? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}