import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FormField } from '../components/UI';

export default function AuthPage({ mode = 'login' }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0f14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: -200, right: -200, width: 600, height: 600,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: -300, left: -200, width: 700, height: 700,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#fff'
          }}>T</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Task<span style={{ color: '#6366f1' }}>Flow</span>
          </h1>
          <p style={{ color: '#8891a8', fontSize: 14 }}>
            {isLogin ? 'Welcome back. Sign in to continue.' : 'Create your workspace in seconds.'}
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: '#13161f', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 32
        }}>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <FormField label="Full name">
                <input
                  type="text" placeholder="Alex Johnson" required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </FormField>
            )}
            <FormField label="Email address">
              <input
                type="email" placeholder="you@company.com" required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </FormField>
            <FormField label="Password">
              <input
                type="password" placeholder={isLogin ? '••••••••' : 'Min. 6 characters'} required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </FormField>

            {error && (
              <div style={{
                background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                color: '#f43f5e', fontSize: 13
              }}>
                {error}
              </div>
            )}

            <button
              type="submit" className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginBottom: 16 }}
            >
              {loading ? <span className="spinner" /> : (isLogin ? 'Sign in' : 'Create account')}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#8891a8' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Link
                to={isLogin ? '/signup' : '/login'}
                style={{ color: '#818cf8', fontWeight: 500 }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
