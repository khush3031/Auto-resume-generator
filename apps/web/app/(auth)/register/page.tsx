'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../../src/store/auth.store';
import { Logo } from '../../../components/Logo';

const registerSchema = z
  .object({
    fullName:        z.string().min(2, 'Full name is required'),
    email:           z.string().email('Enter a valid email'),
    password:        z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6),
    agreedToTerms:   z.literal(true, { errorMap: () => ({ message: 'You must agree to the Terms and Privacy Policy' }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const brandFeatures = [
  'Save unlimited resumes',
  'Download as PDF — free',
  'Live preview as you type',
  'Switch templates anytime',
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

export default function RegisterPage() {
  const router         = useRouter();
  const registerAction = useAuthStore((s) => s.register);
  const [formError, setFormError]       = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const { register, handleSubmit, formState } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      await registerAction(values.fullName, values.email, values.password, true);
      router.push('/templates');
    } catch (err) {
      setFormError((err as Error).message || 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Left: Branding panel */}
        <div className="auth-brand">
          <div style={{ marginBottom: '2rem' }}>
            <Logo size={40} textColor="#ffffff" />
            <p className="auth-brand__desc" style={{ marginTop: '1.5rem' }}>
              Create your ResumeForge account and unlock everything — no credit card required, ever.
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
          <p className="auth-form__eyebrow">Register</p>
          <h1 className="auth-form__title">Create your ResumeForge account</h1>
          <p className="auth-form__subtitle">
            Sign up to save resumes, access the dashboard, and download PDFs.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form__body" noValidate>
            <div className="form-field">
              <label className="form-label">Full name</label>
              <input {...register('fullName')} placeholder="Jane Smith" className="form-input" />
              {formState.errors.fullName && (
                <p className="form-error">{formState.errors.fullName.message}</p>
              )}
            </div>

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

            <div className="form-field">
              <label className="form-label">Confirm password</label>
              <div className="form-input-wrap">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className="form-input form-input--with-icon"
                />
                <button
                  type="button"
                  className="form-eye-btn"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {formState.errors.confirmPassword && (
                <p className="form-error">{formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="form-field">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  {...register('agreedToTerms')}
                  className="form-checkbox"
                />
                <span className="form-checkbox-text">
                  I have read and agree to the{' '}
                  <Link href="/terms" target="_blank" className="auth-form__link">Terms &amp; Conditions</Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" className="auth-form__link">Privacy Policy</Link>
                </span>
              </label>
              {formState.errors.agreedToTerms && (
                <p className="form-error">{formState.errors.agreedToTerms.message}</p>
              )}
            </div>

            {formError && <p className="form-server-error">{formError}</p>}

            <button type="submit" disabled={formState.isSubmitting} className="form-submit">
              {formState.isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-form__footer">
            Already have an account?{' '}
            <Link href="/login" className="auth-form__link">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
