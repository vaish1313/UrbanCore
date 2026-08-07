/**
 * Login Page — Authentication form with role selection
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@shared/api/client';
import { useAuthStore } from '../store/authStore';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.token);
      navigate('/');
    },
  });

  return (
    <div className={styles.container}>
      <div className={styles.backdrop} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🛰️</div>
          <div>
            <h1 className={styles.logoName}>UrbanCore</h1>
            <p className={styles.logoTagline}>Geospatial Intelligence Platform</p>
          </div>
        </div>

        <h2 className={styles.heading}>Sign in to your account</h2>

        <form
          className={styles.form}
          onSubmit={(e) => { e.preventDefault(); mutate(); }}
        >
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>Email</label>
            <input
              id="login-email"
              type="email"
              className={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>Password</label>
            <input
              id="login-password"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className={styles.error} role="alert">
              Invalid email or password. Please try again.
            </div>
          )}

          <button
            id="btn-login"
            type="submit"
            className={styles.submitBtn}
            disabled={isPending}
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.registerLink}>
          Don&apos;t have an account?{' '}
          <a href="/register" id="link-register">Create one</a>
        </p>

        {/* Role badge legend */}
        <div className={styles.roleLegend}>
          <span>Roles:</span>
          {['Citizen', 'Owner', 'Builder', 'Municipal'].map((r) => (
            <span key={r} className={styles.roleBadge}>{r}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
