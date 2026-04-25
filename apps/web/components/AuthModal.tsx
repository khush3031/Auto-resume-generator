'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../src/store/auth.store';
import { Logo } from './Logo';

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters')
});

const registerSchema = z
  .object({
    fullName:        z.string().min(2, 'Full name is required'),
    email:           z.string().email('Enter a valid email'),
    password:        z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match'
  });

type LoginValues    = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode,        setMode]        = useState<'login' | 'register'>('login');
  const [serverError, setServerError] = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);

  const loginAction    = useAuthStore((s) => s.login);
  const registerAction = useAuthStore((s) => s.register);

  const loginForm    = useForm<LoginValues>({    resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setServerError(null);
    setSuccess(false);
    loginForm.reset();
    registerForm.reset();
  };

  const onLogin = async (values: LoginValues) => {
    setServerError(null);
    try {
      await loginAction(values.email, values.password);
      setSuccess(true);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setServerError((err as Error).message || 'Login failed. Check your credentials.');
    }
  };

  const onRegister = async (values: RegisterValues) => {
    setServerError(null);
    try {
      await registerAction(values.fullName, values.email, values.password);
      setSuccess(true);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setServerError((err as Error).message || 'Registration failed. Try a different email.');
    }
  };

  const formBody = (
    <div>
      <div className="modal-header">
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '1rem' }}>
            <Logo size={28} />
          </div>
          <h2 className="modal-title">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="modal-subtitle">
            {mode === 'login'
              ? 'Sign in to save your resume and download PDFs.'
              : 'Sign up to unlock PDF downloads and save your work.'}
          </p>
        </div>
        <button onClick={onClose} aria-label="Close" className="modal-close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="modal-tabs">
        <button
          onClick={() => switchMode('login')}
          className={`modal-tab ${mode === 'login' ? 'modal-tab--active' : 'modal-tab--inactive'}`}
        >
          Log in
        </button>
        <button
          onClick={() => switchMode('register')}
          className={`modal-tab ${mode === 'register' ? 'modal-tab--active' : 'modal-tab--inactive'}`}
        >
          Register
        </button>
      </div>

      <div className="modal-body">
        {success ? (
          <div className="modal-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <p className="modal-success__text">
              {mode === 'login' ? 'Signed in! Resuming your download…' : 'Account created! Resuming your download…'}
            </p>
          </div>
        ) : mode === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="modal-form" noValidate>
            <ModalField label="Email address" error={loginForm.formState.errors.email?.message}>
              <input type="email" placeholder="you@example.com" {...loginForm.register('email')} className="modal-input" />
            </ModalField>
            <ModalField label="Password" error={loginForm.formState.errors.password?.message}>
              <input type="password" placeholder="••••••••" {...loginForm.register('password')} className="modal-input" />
            </ModalField>
            {serverError && <p className="modal-server-error">{serverError}</p>}
            <button type="submit" disabled={loginForm.formState.isSubmitting} className="modal-submit">
              {loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="modal-form" noValidate>
            <ModalField label="Full name" error={registerForm.formState.errors.fullName?.message}>
              <input placeholder="Jane Smith" {...registerForm.register('fullName')} className="modal-input" />
            </ModalField>
            <ModalField label="Email address" error={registerForm.formState.errors.email?.message}>
              <input type="email" placeholder="you@example.com" {...registerForm.register('email')} className="modal-input" />
            </ModalField>
            <ModalField label="Password" error={registerForm.formState.errors.password?.message}>
              <input type="password" placeholder="••••••••" {...registerForm.register('password')} className="modal-input" />
            </ModalField>
            <ModalField label="Confirm password" error={registerForm.formState.errors.confirmPassword?.message}>
              <input type="password" placeholder="••••••••" {...registerForm.register('confirmPassword')} className="modal-input" />
            </ModalField>
            {serverError && <p className="modal-server-error">{serverError}</p>}
            <button type="submit" disabled={registerForm.formState.isSubmitting} className="modal-submit">
              {registerForm.formState.isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div className="modal-mobile" role="dialog" aria-modal="true" aria-label={mode === 'login' ? 'Sign in' : 'Create account'}>
        <div className="modal-mobile__backdrop" onClick={onClose} aria-hidden="true" />
        <div className="modal-mobile__sheet">
          <div className="modal-mobile__handle" aria-hidden="true" />
          <div className="modal-mobile__body">{formBody}</div>
        </div>
      </div>

      {/* Tablet+: centered dialog */}
      <div
        className="modal-desktop"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'login' ? 'Sign in' : 'Create account'}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="modal-desktop__backdrop" onClick={onClose} aria-hidden="true" />
        <div className="modal-desktop__card">{formBody}</div>
      </div>
    </>
  );
}

function ModalField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="modal-field">
      <label className="modal-label">{label}</label>
      {children}
      {error && <p className="modal-error">{error}</p>}
    </div>
  );
}
