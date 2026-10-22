import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { login as apiLogin } from '../../api';
import { useAuth } from '../../context/AuthContext';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Already logged in — use Navigate component instead of imperative navigate() during render
  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const validate = () => {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await apiLogin(email, password);
      login(res.data.token, res.data.admin);
      toast.success('Welcome back!');
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0faf4 0%, #e8f5ee 50%, #d1f0e1 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-mid))',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(26,107,60,0.3)',
          }}>
            <ShoppingBag size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
            Admin Login
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 'var(--fs-sm)' }}>
            Sign in to manage your shop
          </p>
        </div>

        {/* Form Card */}
        <div className="card animate-scale-in">
          <div style={{ padding: '2rem' }}>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="admin-email">
                  <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Email Address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  className={`form-control ${errors.email ? 'error' : ''}`}
                  placeholder="admin@myshop.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                  autoComplete="email"
                  autoFocus
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="admin-password">
                  <Lock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="admin-password"
                    type={showPass ? 'text' : 'password'}
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                    autoComplete="current-password"
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)',
                      display: 'flex', padding: '4px',
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={isLoading}
                id="login-submit"
              >
                {isLoading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 'var(--fs-xs)', color: 'var(--gray-400)' }}>
          This is a private admin area. Unauthorised access is prohibited.
        </p>

        <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          <a href="/" style={{ fontSize: 'var(--fs-sm)', color: 'var(--primary)', fontWeight: 500 }}>
            ← Back to Store
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
