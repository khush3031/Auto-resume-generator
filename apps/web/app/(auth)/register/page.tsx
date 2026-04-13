'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../../src/store/auth.store';

const registerSchema = z
  .object({
    fullName:        z.string().min(2, 'Full name is required'),
    email:           z.string().email('Enter a valid email'),
    password:        z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6)
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match'
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const brandFeatures = [
  'Save unlimited resumes',
  'Download as PDF — free',
  'Live preview as you type',
  'Switch templates anytime',
];

export default function RegisterPage() {
  const router         = useRouter();
  const registerAction = useAuthStore((s) => s.register);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      await registerAction(values.fullName, values.email, values.password);
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
          <div>
            <h2 className="auth-brand__title">Start for free</h2>
            <p className="auth-brand__desc">
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
              <input type="password" {...register('password')} placeholder="••••••••" className="form-input" />
              {formState.errors.password && (
                <p className="form-error">{formState.errors.password.message}</p>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Confirm password</label>
              <input type="password" {...register('confirmPassword')} placeholder="••••••••" className="form-input" />
              {formState.errors.confirmPassword && (
                <p className="form-error">{formState.errors.confirmPassword.message}</p>
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
