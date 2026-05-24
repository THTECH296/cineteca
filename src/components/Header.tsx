import { useRef, useState, type ChangeEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { Step } from '../types';
import logo from '../assets/logo-cineteca.png';

interface Props {
  step: Step;
  onHome: () => void;
}

const STEPS = [{ label: 'Filme' }, { label: 'Sessão' }, { label: 'Lugares' }, { label: 'Pagamento' }, { label: 'Ingresso' }];
const STEP_INDEX: Record<Step, number> = { cartaz: 0, sessao: 1, auth: 2, assentos: 2, pagamento: 3, confirmado: 4 };

export default function Header({ step, onHome }: Props) {
  const { user, signOut, uploadAvatar } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const current = STEP_INDEX[step];
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initial = name.charAt(0).toUpperCase() || 'U';

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    await uploadAvatar(file);
    setBusy(false);
  };

  const avatarInner = avatarUrl ? <img src={avatarUrl} alt="" /> : initial;

  return (
    <header className="hd">
     <div className="hd__inner">
      <button className="hd__brand" onClick={onHome} aria-label="Início — CineTeca">
        <img className="hd__logo" src={logo} alt="CineTeca" />
        <span className="hd__loc">Teófilo Otoni · MG</span>
      </button>

      <nav className="hd__steps" aria-label="Etapas">
        {STEPS.map((s, i) => (
          <span key={s.label} className={`hd__step${i === current ? ' is-active' : ''}${i < current ? ' is-done' : ''}`}>
            <i>{i < current ? '✓' : i + 1}</i>
            {s.label}
          </span>
        ))}
      </nav>

      {user && (
        <div className="hd__user">
          <button className="hd__avatar" onClick={() => setOpen((o) => !o)} aria-label="Abrir perfil">
            {avatarInner}
          </button>

          {open && (
            <>
              <div className="hd__backdrop" onClick={() => setOpen(false)} />
              <div className="hd__menu">
                <div className="hd__menu-head">
                  <span className="hd__avatar hd__avatar--lg">{avatarInner}</span>
                  <div className="hd__menu-id">
                    <b>{name}</b>
                    <small>{user.email}</small>
                  </div>
                </div>
                <button className="hd__menu-item" onClick={() => fileRef.current?.click()} disabled={busy}>
                  {busy ? 'Enviando foto…' : avatarUrl ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
                </button>
                <button className="hd__menu-item hd__menu-item--danger" onClick={() => { setOpen(false); signOut(); }}>
                  Sair da conta
                </button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
              </div>
            </>
          )}
        </div>
      )}
     </div>
    </header>
  );
}
