import { useState, type FormEvent } from 'react';
import { Button, Card, Field, Input, MessageBar, MessageBarBody, Title1 } from '@fluentui/react-components';
import { ArrowLeftRegular, CalendarLtrRegular, PersonAddRegular, PersonRegular } from '@fluentui/react-icons';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      await signIn({ email, password });
      const destination = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(destination, { replace: true });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Sign in failed.'); }
    finally { setBusy(false); }
  }

  return (
    <AuthFrame>
      <p className="eyebrow eyebrow--plain"><span /> Welcome back</p>
      <Title1>Sign in to your plan</Title1>
      <p className="muted-copy">Your time, priorities, and next steps in one place.</p>
      {error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}
      <form className="auth-form" onSubmit={(event) => { void submit(event); }}>
        <Field label="Email" required><Input type="email" autoComplete="email" value={email} onChange={(_, data) => setEmail(data.value)} /></Field>
        <Field label="Password" required><Input type="password" autoComplete="current-password" value={password} onChange={(_, data) => setPassword(data.value)} /></Field>
        <Button appearance="primary" type="submit" icon={<PersonRegular />} disabled={busy}>Sign in</Button>
      </form>
      <p className="auth-switch">New to Schedule Planner? <Link to="/create-account">Create account</Link></p>
    </AuthFrame>
  );
}

export function CreateAccountPage() {
  const { user, createAccount } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (name.trim().length < 2) { setError('Enter your name (at least 2 characters).'); return; }
    if (password.length < 12) { setError('Use a password with at least 12 characters.'); return; }
    setBusy(true);
    try { await createAccount({ name, email, password }); navigate('/', { replace: true }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Your account could not be created.'); }
    finally { setBusy(false); }
  }

  return (
    <AuthFrame>
      <Link to="/login" className="back-link"><ArrowLeftRegular /> Back to sign in</Link>
      <p className="eyebrow eyebrow--plain"><span /> Start with a clear week</p>
      <Title1>Create your account</Title1>
      <p className="muted-copy">Keep your goals and weekly commitments together.</p>
      {error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}
      <form className="auth-form" onSubmit={(event) => { void submit(event); }} noValidate>
        <Field label="Name" required><Input autoComplete="name" value={name} onChange={(_, data) => setName(data.value)} /></Field>
        <Field label="Email" required><Input type="email" autoComplete="email" value={email} onChange={(_, data) => setEmail(data.value)} /></Field>
        <Field label="Password" required hint="At least 12 characters"><Input type="password" autoComplete="new-password" value={password} onChange={(_, data) => setPassword(data.value)} /></Field>
        <Button appearance="primary" type="submit" icon={<PersonAddRegular />} disabled={busy}>Create account</Button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthFrame>
  );
}

function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <Card className="auth-card" appearance="outline">
        <Link to="/" className="brand-lockup auth-brand"><span className="brand-mark"><CalendarLtrRegular /></span><span>Schedule Planner</span></Link>
        {children}
      </Card>
    </main>
  );
}