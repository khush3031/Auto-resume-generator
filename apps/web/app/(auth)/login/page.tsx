'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../../src/store/auth.store';

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const brandFeatures = [
  '16+ Professional templates',
  '100% Free to use',
  'ATS-ready formats',
  'No design skills needed',
];

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const returnUrl    = searchParams.get('returnUrl') || '/templates';
  const login        = useAuthStore((s) => s.login);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.push(returnUrl);
    } catch (err) {
      setFormError((err as Error).message || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Left: Branding panel */}
        <div className="auth-brand">
          <div>
            <h2 className="auth-brand__title">ResumeForge</h2>
            <p className="auth-brand__desc">
              Build professional resumes in minutes. Choose from 16+ templates
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

        {/* Right: Form */}
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
              <input type="password" {...register('password')} placeholder="••••••••" className="form-input" />
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
            <Link href="/register" className="auth-form__link">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
