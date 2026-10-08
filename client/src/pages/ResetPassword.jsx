import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) setValidToken(false);
  }, [token]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { error('Passwords do not match'); return; }
    if (!token) { error('Invalid reset link'); return; }
    setLoading(true);
    try {
      await resetPassword(token, form.password);
      success('Password reset successful');
      navigate('/login');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  if (!validToken) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Invalid Reset Link</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn btn-primary">Request New Link</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Enter your new password</p>
        <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} /></div>
        <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-input" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required minLength={6} /></div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}><Link to="/login">Back to Login</Link></p>
      </form>
    </div>
  );
}