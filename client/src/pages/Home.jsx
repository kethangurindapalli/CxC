import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', color: 'white', padding: '4rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Find people solving the same problem</h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '2rem', maxWidth: '700px', margin: '0 auto 2rem' }}><strong>CxC - Connect and Collab</strong> connects you with people working on similar projects, topics and challenges — so you can share knowledge, solve problems faster, and collaborate.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {user ? <Link to="/dashboard" className="btn btn-secondary" style={{ background: 'white', color: '#2563eb', padding: '0.875rem 2rem' }}>Go to Dashboard</Link> : <>
              <Link to="/register" className="btn" style={{ background: 'white', color: '#2563eb', padding: '0.875rem 2rem' }}>Get Started</Link>
              <Link to="/login" className="btn btn-outline" style={{ borderColor: 'white', color: 'white', padding: '0.875rem 2rem' }}>Login</Link>
            </>}
          </div>
        </div>
      </div>
      <div className="container" style={{ padding: '3rem 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {[
            { title: 'Create Project', desc: 'Describe your project, technologies and current problem.' },
            { title: 'Find Matches', desc: 'Our similarity engine finds people with similar topics, tech & problems.' },
            { title: 'Connect & Chat', desc: 'Send connection requests and chat securely with accepted connections.' },
            { title: 'Privacy First', desc: 'Control visibility, go anonymous, and keep private details safe.' },
          ].map(f => (
            <div key={f.title} className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '3rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>How matching works</h3>
          <p style={{ color: 'var(--text-secondary)' }}>We compare category, technologies, skills and problem keywords to compute a similarity percentage (e.g., 91% Match) and show why you match: Similar topic, Same technology, Similar problem. Active & available users are prioritized. Matching is modular — ready for future AI enhancement.</p>
        </div>
      </div>
    </div>
  );
}
