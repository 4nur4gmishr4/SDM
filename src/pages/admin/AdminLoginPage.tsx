import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLoginPage.css';

const AdminLoginSchema = z.object({
  email: z.string().email("Please enter a valid admin email address."),
  password: z.string().min(8, "Invalid credentials.")
});

// Maximum failed login attempts allowed before lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 60;

// Injection detection patterns (SQL, script tags, suspicious payloads)
const INJECTION_REGEX = /('|"|;|--|\/\*|\*\/|@@|char|nchar|varchar|nvarchar|alter|begin|cast|create|cursor|declare|delete|drop|end|exec|execute|fetch|insert|kill|open|select|sys|sysobjects|syscolumns|table|update|<script|<\/script>|javascript:|onerror=|onload=)/i;

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Rate-limiting / Brute-force protection
  const [failedAttempts, setFailedAttempts] = useState(() => {
    const saved = sessionStorage.getItem('sdsm_admin_fails');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lockoutRemaining, setLockoutRemaining] = useState(() => {
    const until = sessionStorage.getItem('sdsm_admin_lockout_until');
    if (!until) return 0;
    const diff = Math.ceil((parseInt(until, 10) - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  const timerRef = useRef<any>(null);

  const { signIn, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = 'Admin Portal | Sai Darshan Shopping Mart';

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutRemaining > 0) {
      timerRef.current = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            sessionStorage.removeItem('sdsm_admin_lockout_until');
            sessionStorage.removeItem('sdsm_admin_fails');
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockoutRemaining]);

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      const from = (location.state as any)?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [session, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check lockout
    if (lockoutRemaining > 0) {
      setError(`Access locked for security. Please wait ${lockoutRemaining} seconds.`);
      return;
    }

    // Input sanitization & bounds check
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    // Zod schema validation
    const validationResult = AdminLoginSchema.safeParse({ email: cleanEmail, password: cleanPassword });
    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message);
      return;
    }

    if (cleanEmail.length > 80 || cleanPassword.length > 100) {
      setError('Invalid input length detected.');
      return;
    }

    // Anti-injection strict validation
    if (INJECTION_REGEX.test(cleanEmail)) {
      console.warn('Suspicious characters detected in login attempt.');
      setError('Invalid characters detected in login request.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error: signInError } = await signIn(cleanEmail, cleanPassword);

      if (signInError) {
        throw new Error(signInError);
      }

      // Successful login: reset failed attempts
      sessionStorage.removeItem('sdsm_admin_fails');
      sessionStorage.removeItem('sdsm_admin_lockout_until');
      setFailedAttempts(0);
    } catch (err: any) {
      console.error('Admin authentication failure', err);
      const newFails = failedAttempts + 1;
      setFailedAttempts(newFails);
      sessionStorage.setItem('sdsm_admin_fails', String(newFails));

      if (newFails >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
        sessionStorage.setItem('sdsm_admin_lockout_until', String(lockoutUntil));
        setLockoutRemaining(LOCKOUT_DURATION_SECONDS);
        setError(`Maximum failed attempts exceeded. Security lockout engaged for ${LOCKOUT_DURATION_SECONDS} seconds.`);
      } else {
        setError(`Invalid credentials. ${MAX_FAILED_ATTEMPTS - newFails} attempt(s) remaining before security lockout.`);
      }

      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-badge-wrap">
            <span className="material-symbols-outlined admin-login-shield-icon">shield</span>
          </div>
          <h1 className="admin-login-title">Administrator Portal</h1>
          <p className="admin-login-subtitle">Secured administrative access for store operations</p>
        </div>

        {error && (
          <div className="admin-login-error" role="alert">
            <span className="material-symbols-outlined admin-login__alert-icon">warning</span>
            <span>{error}</span>
          </div>
        )}

        {lockoutRemaining > 0 && (
          <div className="admin-login-lockout-banner">
            <span className="material-symbols-outlined spin-anim admin-login__lock-icon">lock_clock</span>
            <div>
              <strong>Security Cooldown:</strong> Please wait {lockoutRemaining}s
            </div>
          </div>
        )}

        <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
          {/* Email input */}
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="admin-email">
              Admin Email
            </label>
            <div className="admin-input-wrapper">
              <span className="material-symbols-outlined admin-input-icon">mail</span>
              <input
                id="admin-email"
                type="email"
                required
                maxLength={80}
                autoComplete="username"
                className="admin-input-field"
                placeholder="admin@saidarshanmart.com"
                value={email}
                disabled={isSubmitting || lockoutRemaining > 0}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password input with show/hide toggle */}
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="admin-password">
              Security Key / Password
            </label>
            <div className="admin-input-wrapper">
              <span className="material-symbols-outlined admin-input-icon">lock</span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                maxLength={100}
                autoComplete="current-password"
                className="admin-input-field"
                placeholder="Enter admin password"
                value={password}
                disabled={isSubmitting || lockoutRemaining > 0}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="admin-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined admin-login__input-icon">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button 
            className="sdsm-btn sdsm-btn--primary admin-login-btn" 
            type="submit"
            disabled={isSubmitting || lockoutRemaining > 0}
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In Securely'}</span>
            <span className="material-symbols-outlined admin-login__btn-icon">arrow_forward</span>
          </button>
        </form>

        <div className="admin-login-footer-info">
          <span className="material-symbols-outlined admin-login__secure-icon">verified_user</span>
          <span>Encrypted session &bull; Direct store authentication</span>
        </div>
      </div>
    </div>
  );
}
