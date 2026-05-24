import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import logo from '../assets/logo-cineteca.png';
import AdminMovies from './AdminMovies';
import AdminDashboard from './AdminDashboard';

const ADMIN_EMAIL = 'admin@cineteca.dev';

function AdminLogin({ signIn }: { signIn: (e: string, p: string) => Promise<{ error?: string }> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const r = await signIn(email, password);
    setBusy(false);
    if (r.error) setError(r.error);
  };

  return (
    <div className="adm-login">
      <div className="adm-login__card">
        <span className="adm-badge">PAINEL ADMINISTRATIVO</span>
        <h1 className="adm-login__title">CineTeca · Admin</h1>
        <p className="adm-login__sub">Acesso restrito. Entre com as credenciais de administrador.</p>
        <form onSubmit={submit} className="auth__form">
          <input type="email" placeholder="E-mail do admin" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="auth__msg auth__msg--err">{error}</p>}
          <button type="submit" className="primary" disabled={busy}>{busy ? 'Entrando…' : 'Entrar no painel'}</button>
        </form>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { user, loading, signIn, signOut } = useAuth();
  const [tab, setTab] = useState<'painel' | 'filmes'>('painel');

  if (loading) return <div className="adm-load">Carregando…</div>;
  if (!user) return <AdminLogin signIn={signIn} />;

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="adm-login">
        <div className="adm-login__card">
          <div className="pix-expired__ic">🔒</div>
          <h1 className="adm-login__title">Acesso negado</h1>
          <p className="adm-login__sub">Você está logado como <b>{user.email}</b>, que não tem permissão de administrador.</p>
          <button className="primary" onClick={signOut}>Sair e entrar como admin</button>
          <a className="adm-back" href="./">← Voltar ao site</a>
        </div>
      </div>
    );
  }

  return (
    <div className="adm">
      <header className="adm-hd">
        <div className="adm-hd__brand">
          <img className="adm-logo" src={logo} alt="CineTeca" />
          <span className="adm-tag-admin">ADMIN</span>
        </div>
        <nav className="adm-tabs">
          <button className={tab === 'painel' ? 'is-on' : ''} onClick={() => setTab('painel')}>Painel & Vendas</button>
          <button className={tab === 'filmes' ? 'is-on' : ''} onClick={() => setTab('filmes')}>Filmes</button>
        </nav>
        <div className="adm-hd__right">
          <a className="adm-link" href="./">Ver site ↗</a>
          <button className="adm-out" onClick={signOut}>Sair</button>
        </div>
      </header>
      <main className="adm-main">
        {tab === 'painel' ? <AdminDashboard /> : <AdminMovies />}
      </main>
    </div>
  );
}
