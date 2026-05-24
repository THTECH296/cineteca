import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

function make(storageKey: string, detectSessionInUrl: boolean): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(url as string, anonKey as string, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl, storageKey },
  });
}

// Sessões independentes: o site e o admin guardam o login em chaves diferentes,
// então logar/sair em um NÃO afeta o outro.
export const supabase = make('sb-cineteca-app', true);
export const supabaseAdmin = make('sb-cineteca-admin', false);
