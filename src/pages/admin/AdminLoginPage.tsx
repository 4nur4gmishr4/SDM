import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLoginPage.css';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      const from = (location.state as any)?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [session, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        throw signInError;
      }
      
      // Navigation is handled by the useEffect above when session changes
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--md-sys-color-primary)', marginBottom: '16px' }}>admin_panel_settings</span>
          <h1 className="admin-login-title">Admin Login</h1>
          <p className="admin-login-subtitle">Sign in to manage Sai Darshan Mart</p>
        </div>

        {error && (
          <div className="admin-login-error">
            {error}
          </div>
        )}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <md-outlined-text-field
            className="admin-login-field"
            label="Email"
            type="email"
            required
            value={email}
            onInput={(e: any) => setEmail(e.target.value)}
          >
            <md-icon slot="leading-icon">mail</md-icon>
          </md-outlined-text-field>

          <md-outlined-text-field
            className="admin-login-field"
            label="Password"
            type="password"
            required
            value={password}
            onInput={(e: any) => setPassword(e.target.value)}
          >
            <md-icon slot="leading-icon">lock</md-icon>
          </md-outlined-text-field>

          <md-filled-button 
            className="admin-login-submit" 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
            <md-icon slot="icon">login</md-icon>
          </md-filled-button>
        </form>

        <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: 'var(--md-sys-color-surface-container)', borderRadius: '8px', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', lineHeight: '1.5' }}>
          <div>Testing Credentials:</div>
          <div style={{ fontWeight: 600, color: 'var(--md-sys-color-primary)', marginTop: '2px' }}>
            admin@saidarshanmart.com &bull; admin123
          </div>
        </div>
      </div>
    </div>
  );
}
