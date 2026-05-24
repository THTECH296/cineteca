import { supabase, supabaseAdmin } from './supabase';
import type { Movie, SeatChoice } from '../types';

export interface OrderRow {
  id: string;
  user_id: string | null;
  movie_id: string | null;
  movie_title: string | null;
  session_date: string;
  session_time: string;
  seats: SeatChoice[];
  amount: number;
  method: string;
  status: 'paid' | 'cancelled';
  created_at: string;
}

interface MovieRow {
  id: string;
  title: string;
  genre: string;
  duration: number;
  rating: string;
  synopsis: string;
  accent: string;
  format: string;
  poster_url: string | null;
  price: number;
  times: string[] | null;
  active: boolean;
}

function rowToMovie(r: MovieRow): Movie {
  return {
    id: r.id,
    title: r.title,
    genre: r.genre,
    duration: r.duration,
    rating: r.rating,
    synopsis: r.synopsis,
    accent: r.accent,
    format: r.format,
    poster: r.poster_url ?? undefined,
    price: r.price,
    times: r.times ?? [],
  };
}

// ───────── Cliente do SITE (sessão do usuário comum) ─────────
export async function fetchMovies(activeOnly = true): Promise<Movie[]> {
  if (!supabase) return [];
  let q = supabase.from('movies').select('*').order('created_at', { ascending: true });
  if (activeOnly) q = q.eq('active', true);
  const { data } = await q;
  return ((data as MovieRow[]) ?? []).map(rowToMovie);
}

export async function getMovie(id: string): Promise<Movie | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('movies').select('*').eq('id', id).maybeSingle();
  return data ? rowToMovie(data as MovieRow) : null;
}

export async function createOrder(o: {
  userId: string;
  movieId: string;
  movieTitle: string;
  date: string;
  time: string;
  seats: SeatChoice[];
  amount: number;
  method: string;
}): Promise<void> {
  if (!supabase) return;
  await supabase.from('orders').insert({
    user_id: o.userId,
    movie_id: o.movieId,
    movie_title: o.movieTitle,
    session_date: o.date,
    session_time: o.time,
    seats: o.seats,
    amount: o.amount,
    method: o.method,
    status: 'paid',
  });
}

export async function fetchOccupiedSeats(movieId: string, date: string, time: string): Promise<string[]> {
  if (!supabase) return [];
  const { data } = await supabase.rpc('occupied_seats', { p_movie: movieId, p_date: date, p_time: time });
  return (data as string[]) ?? [];
}

// ───────── Cliente do ADMIN (sessão do admin, isolada) ─────────
export async function adminFetchMovies(): Promise<Movie[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.from('movies').select('*').order('created_at', { ascending: true });
  return ((data as MovieRow[]) ?? []).map(rowToMovie);
}

export async function adminUploadPoster(file: File): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabaseAdmin.storage.from('posters').upload(path, file, { contentType: file.type, upsert: true });
  if (error) return null;
  return supabaseAdmin.storage.from('posters').getPublicUrl(path).data.publicUrl;
}

export async function adminSaveMovie(m: {
  id?: string;
  title: string;
  genre: string;
  duration: number;
  rating: string;
  synopsis: string;
  accent: string;
  format: string;
  poster_url: string | null;
  price: number;
  times: string[];
  active: boolean;
}): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Supabase não configurado.' };
  const { error } = m.id
    ? await supabaseAdmin.from('movies').update(m).eq('id', m.id)
    : await supabaseAdmin.from('movies').insert(m);
  return error ? { error: error.message } : {};
}

export async function adminDeleteMovie(id: string): Promise<{ error?: string }> {
  if (!supabaseAdmin) return { error: 'Supabase não configurado.' };
  const { error } = await supabaseAdmin.from('movies').delete().eq('id', id);
  return error ? { error: error.message } : {};
}

export async function adminFetchOrders(): Promise<OrderRow[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
  return (data as OrderRow[]) ?? [];
}

export async function adminCancelOrder(id: string): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', id);
}

/** Realtime de pedidos (usado no painel admin). */
export function subscribeOrders(cb: () => void): () => void {
  const client = supabaseAdmin;
  if (!client) return () => {};
  const ch = client
    .channel(`orders-rt-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, cb)
    .subscribe();
  return () => { client.removeChannel(ch); };
}
