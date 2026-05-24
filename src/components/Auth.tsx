import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { Movie } from '../types';
import { formatBRDate } from '../data/movies';

interface Props {
  movie: Movie;
  date: string;
  weekday: string;
  time: string;
  onBack: () => void;
}

export default function Auth({ movie, date, weekday, time, onBack }: Props) {
  const { signIn, signUp, signInGoogle, configured } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    const res = mode === 'login' ? await signIn(email, password) : await signUp(name, email, password);
    setBusy(false);
    if (res.error) setError(res.error);
    else if ('needsConfirm' in res && res.needsConfirm) {
      setInfo('Conta criada! Confirme pelo link enviado ao seu e-mail e depois faça login.');
      setMode('login');
    }
  };

  const google = async () => {
    setError('');
    const r = await signInGoogle();
    if (r.error) setError(r.error);
  };

  return (
    <section className="auth">
      <button className="back" onClick={onBack}>← Voltar à sessão</button>

      <div className="auth__card">
        <div className="auth__resume">
          <span className="auth__resume-k">Sua sessão</span>
          <b>{movie.title}</b>
          <span>{weekday}, {formatBRDate(date)} · {time}</span>
        </div>

        <h1 className="auth__title">{mode === 'login' ? 'Entre para continuar' : 'Crie sua conta'}</h1>
        <p className="auth__sub">Falta pouco para garantir seus lugares.</p>

        {!configured && (
          <p className="auth__warn">⚠️ Supabase ainda não configurado — preencha o <code>.env.local</code> com as chaves do projeto.</p>
        )}

        <button className="gbtn" onClick={google} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18 13.6 24 13.6c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C39.9 36.5 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
          Continuar com Google
        </button>

        <div className="auth__or"><span>ou com e-mail</span></div>

        <form onSubmit={submit} className="auth__form">
          {mode === 'signup' && (
            <input type="text" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />

          {error && <p className="auth__msg auth__msg--err">{error}</p>}
          {info && <p className="auth__msg auth__msg--ok">{info}</p>}

          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className="auth__switch">
          {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}>
            {mode === 'login' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </section>
  );
}
