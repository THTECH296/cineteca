import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Movie } from '../types';
import { adminFetchMovies, adminFetchOrders, adminCancelOrder, subscribeOrders, type OrderRow } from '../lib/db';
import { sessionsFor, formatBRDate } from '../data/movies';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = 10;
const TOTAL_SEATS = ROWS.length * COLS;

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selMovie, setSelMovie] = useState('');
  const [selDate, setSelDate] = useState('');
  const [selTime, setSelTime] = useState('');

  const reload = useCallback(async () => setOrders(await adminFetchOrders()), []);

  useEffect(() => {
    adminFetchMovies().then((ms) => {
      setMovies(ms);
      if (ms[0]) setSelMovie(ms[0].id);
    });
  }, []);

  useEffect(() => {
    reload();
    const unsub = subscribeOrders(reload);
    return unsub;
  }, [reload]);

  // sessões do filme selecionado
  const movie = movies.find((m) => m.id === selMovie);
  const days = useMemo(() => (movie ? sessionsFor(movie.times) : []), [movie]);
  useEffect(() => {
    if (days[0]) {
      setSelDate(days[0].date);
      setSelTime(days[0].times[0] ?? '');
    }
  }, [days]);

  // métricas
  const paid = orders.filter((o) => o.status === 'paid');
  const cancelled = orders.filter((o) => o.status === 'cancelled');
  const ticketsSold = paid.reduce((s, o) => s + (o.seats?.length || 0), 0);
  const ticketsCancelled = cancelled.reduce((s, o) => s + (o.seats?.length || 0), 0);
  const revenue = paid.reduce((s, o) => s + o.amount, 0);

  // ocupados da sessão selecionada
  const occupied = new Set<string>();
  paid
    .filter((o) => o.movie_id === selMovie && o.session_date === selDate && o.session_time === selTime)
    .forEach((o) => o.seats?.forEach((s) => occupied.add(s.id)));
  const free = TOTAL_SEATS - occupied.size;

  return (
    <div className="adm-dash">
      <div className="adm-dash__head">
        <div>
          <h1 className="adm-h1">Painel de vendas</h1>
          <p className="adm-sub">Acompanhamento em tempo real da bilheteria.</p>
        </div>
        <span className="adm-live"><i className="pix__dot" /> ao vivo</span>
      </div>

      <div className="adm-cards">
        <div className="adm-card">
          <span className="adm-card__ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4z"/><path d="M14 5v14" stroke-dasharray="2 2"/></svg></span>
          <div className="adm-card__body"><span>Ingressos vendidos</span><b>{ticketsSold}</b></div>
        </div>
        <div className="adm-card">
          <span className="adm-card__ic adm-card__ic--red"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg></span>
          <div className="adm-card__body"><span>Ingressos cancelados</span><b>{ticketsCancelled}</b></div>
        </div>
        <div className="adm-card adm-card--gold">
          <span className="adm-card__ic adm-card__ic--dark"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></span>
          <div className="adm-card__body"><span>Receita (lucro)</span><b>R$ {revenue},00</b></div>
        </div>
        <div className="adm-card">
          <span className="adm-card__ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg></span>
          <div className="adm-card__body"><span>Total de pedidos</span><b>{orders.length}</b></div>
        </div>
      </div>

      <div className="adm-grid2">
        {/* Assentos por sessão (realtime) */}
        <section className="adm-panel">
          <div className="adm-panel__head">
            <h3>Assentos por sessão <i className="pix__dot" /></h3>
            <span className="adm-free">{free} livres · {occupied.size} ocupados</span>
          </div>
          <div className="adm-filters">
            <select value={selMovie} onChange={(e) => setSelMovie(e.target.value)}>
              {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            <select value={selDate} onChange={(e) => setSelDate(e.target.value)}>
              {days.map((d) => <option key={d.date} value={d.date}>{d.isToday ? 'Hoje' : d.weekday.slice(0, 3)} {formatBRDate(d.date).slice(0, 5)}</option>)}
            </select>
            <select value={selTime} onChange={(e) => setSelTime(e.target.value)}>
              {(days.find((d) => d.date === selDate)?.times ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="adm-seats">
            {ROWS.map((row) => (
              <div className="adm-seatrow" key={row}>
                {Array.from({ length: COLS }, (_, i) => {
                  const id = `${row}${i + 1}`;
                  return <span key={id} className={`adm-seat${occupied.has(id) ? ' is-occ' : ''}`} title={id} />;
                })}
              </div>
            ))}
          </div>
        </section>

        {/* Últimos pedidos */}
        <section className="adm-panel">
          <div className="adm-panel__head"><h3>Pedidos recentes</h3></div>
          <div className="adm-orders">
            {orders.length === 0 && <p className="empty">Nenhuma venda ainda.</p>}
            {orders.slice(0, 30).map((o) => (
              <div key={o.id} className={`adm-order${o.status === 'cancelled' ? ' is-cancelled' : ''}`}>
                <div className="adm-order__main">
                  <b>{o.movie_title}</b>
                  <small>{formatBRDate(o.session_date)} · {o.session_time} · {o.seats?.map((s) => s.id).join(', ')}</small>
                </div>
                <span className="adm-order__amount">R$ {o.amount},00</span>
                {o.status === 'paid' ? (
                  <button className="adm-del" onClick={() => adminCancelOrder(o.id)}>Cancelar</button>
                ) : (
                  <span className="adm-tag-cancel">cancelado</span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
