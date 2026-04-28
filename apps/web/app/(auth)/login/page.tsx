'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { templateCount } from '@resumeforge/templates';
import { NavLink } from '../../../components/NavLink';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../../src/store/auth.store';
import { Logo } from '../../../components/Logo';

const TEMPLATE_COUNT_LABEL = `${templateCount}+`;

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const brandFeatures = [
  `${TEMPLATE_COUNT_LABEL} Professional templates`,
  '100% Free to use',
  'ATS-ready formats',
  'No design skills needed',
];

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const returnUrl    = searchParams.get('returnUrl') || '/templates';
  const login        = useAuthStore((s) => s.login);
  const [formError, setFormError]       = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      // Use replace so /login is removed from history — back button skips it.
      router.replace(returnUrl);
    } catch (err) {
      setFormError((err as Error).message || 'Login failed');
    }
  };

  return (
    <div className="auth-form">
      <p className="auth-form__eyebrow">Login</p>
      <h1 className="auth-form__title">Welcome back to ResumeForge</h1>
      <p className="auth-form__subtitle">
        Log in to access your dashboard, manage resumes, and download PDFs.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form__body" noValidate>
        <div className="form-field">
          <label className="form-label">Email address</label>
          <input type="email" {...register('email')} placeholder="you@example.com" className="form-input" />
          {formState.errors.email && (
            <p className="form-error">{formState.errors.email.message}</p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">Password</label>
          <div className="form-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••"
              className="form-input form-input--with-icon"
            />
            <button
              type="button"
              className="form-eye-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          {formState.errors.password && (
            <p className="form-error">{formState.errors.password.message}</p>
          )}
        </div>

        {formError && <p className="form-server-error">{formError}</p>}

        <button type="submit" disabled={formState.isSubmitting} className="form-submit">
          {formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-form__footer">
        New to ResumeForge?{' '}
        <NavLink href="/register" className="auth-form__link">Create an account</NavLink>
      </p>
      <p className="auth-form__footer" style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        By signing in you agree to our{' '}
        <Link href="/terms" target="_blank" className="auth-form__link">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" target="_blank" className="auth-form__link">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Left: Branding panel */}
        <div className="auth-brand">
          <div style={{ marginBottom: '2rem' }}>
            <Logo size={40} textColor="#ffffff" />
            <p className="auth-brand__desc" style={{ marginTop: '1.5rem' }}>
              Build professional resumes in minutes. Choose from {TEMPLATE_COUNT_LABEL} templates
              and download a recruiter-ready PDF for free.
            </p>
          </div>
          <ul className="auth-brand__features">
            {brandFeatures.map((feat) => (
              <li key={feat} className="auth-brand__feature">
                <div className="auth-brand__check">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <span className="auth-brand__feature-text">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Form — wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<div className="auth-form" />}>
          <LoginForm />
        </Suspense>

      </div>
    </div>
  );
}
