import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';

interface AuthValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signInGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<{ error?: string; url?: string }>;
}

const AuthCtx = createContext<AuthValue | null>(null);

function translate(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user already')) return 'Este e-mail já possui conta. Faça login.';
  if (m.includes('rate limit') || m.includes('over_email')) return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.';
  if (m.includes('password')) return 'A senha precisa de no mínimo 6 caracteres.';
  if (m.includes('invalid') && m.includes('email')) return 'Informe um e-mail válido.';
  return msg;
}

/** Provider de autenticação — recebe o cliente Supabase (do site OU do admin),
 *  cada um com sessão isolada. */
export function AuthProvider({ children, client }: { children: ReactNode; client: SupabaseClient | null }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    client.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user ?? null))
      .catch(() => setUser(null)) // backend fora do ar: segue sem sessão em vez de travar
      .finally(() => setLoading(false));
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [client]);

  const signIn: AuthValue['signIn'] = async (email, password) => {
    if (!client) return { error: 'Supabase ainda não configurado.' };
    const { error } = await client.auth.signInWithPassword({ email, password });
    return error ? { error: translate(error.message) } : {};
  };

  const signUp: AuthValue['signUp'] = async (name, email, password) => {
    if (!client) return { error: 'Supabase ainda não configurado.' };
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) return { error: translate(error.message) };
    return { needsConfirm: !data.session };
  };

  const signInGoogle: AuthValue['signInGoogle'] = async () => {
    if (!client) return { error: 'Supabase ainda não configurado.' };
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    return error ? { error: translate(error.message) } : {};
  };

  const signOut = async () => {
    await client?.auth.signOut();
  };

  const uploadAvatar: AuthValue['uploadAvatar'] = async (file) => {
    if (!client || !user) return { error: 'Faça login primeiro.' };
    if (file.size > 2 * 1024 * 1024) return { error: 'Imagem muito grande (máx. 2 MB).' };
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await client.storage.from('avatars').upload(path, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type,
    });
    if (upErr) return { error: upErr.message };
    const { data } = client.storage.from('avatars').getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    const { error: updErr } = await client.auth.updateUser({ data: { avatar_url: url } });
    if (updErr) return { error: updErr.message };
    return { url };
  };

  return (
    <AuthCtx.Provider value={{ user, loading, configured: !!client, signIn, signUp, signInGoogle, signOut, uploadAvatar }}>
      {children}
    </AuthCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
