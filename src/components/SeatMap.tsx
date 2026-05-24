import { useCallback, useEffect, useState } from 'react';
import type { Movie, SeatChoice, TicketType } from '../types';
import { MEIA_CATEGORIAS, totalAssentos } from '../types';
import { fetchOccupiedSeats } from '../lib/db';

interface Props {
  movie: Movie;
  date: string;
  time: string;
  onBack: () => void;
  onConfirm: (seats: SeatChoice[]) => void;
}

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = 10;

export default function SeatMap({ movie, date, time, onBack, onConfirm }: Props) {
  const [occupied, setOccupied] = useState<Set<string>>(new Set());
  const [seats, setSeats] = useState<SeatChoice[]>([]);

  const load = useCallback(async () => {
    const ids = await fetchOccupiedSeats(movie.id, date, time);
    setOccupied(new Set(ids));
  }, [movie.id, date, time]);

  // ocupados reais + atualização periódica (cobre reservas de outros usuários)
  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  // se um assento que eu selecionei foi ocupado por outra pessoa, removo da minha seleção
  useEffect(() => {
    setSeats((prev) => prev.filter((s) => !occupied.has(s.id)));
  }, [occupied]);

  const toggle = (id: string) => {
    if (occupied.has(id)) return;
    setSeats((prev) =>
      prev.some((s) => s.id === id) ? prev.filter((s) => s.id !== id) : [...prev, { id, type: 'inteira' }],
    );
  };

  const setType = (id: string, type: TicketType) =>
    setSeats((prev) => prev.map((s) => (s.id === id ? { ...s, type, category: type === 'inteira' ? undefined : s.category } : s)));
  const setCategory = (id: string, category: string) =>
    setSeats((prev) => prev.map((s) => (s.id === id ? { ...s, category } : s)));

  const ordered = [...seats].sort((a, b) => a.id.localeCompare(b.id));
  const total = totalAssentos(seats, movie.price);
  const faltaCategoria = seats.some((s) => s.type === 'meia' && !s.category);
  const podeContinuar = seats.length > 0 && !faltaCategoria;
  const meia = movie.price / 2;

  return (
    <section className="seats">
      <button className="back" onClick={onBack}>← Trocar sessão</button>
      <p className="kicker">Selecione seus lugares</p>
      <h1 className="title">{movie.title}</h1>

      <div className="screen">TELA</div>

      <div className="map">
        {ROWS.map((row) => (
          <div className="seatrow" key={row}>
            <span className="seatrow__label">{row}</span>
            {Array.from({ length: COLS }, (_, i) => {
              const id = `${row}${i + 1}`;
              const isOcc = occupied.has(id);
              const isSel = seats.some((s) => s.id === id);
              return (
                <button
                  key={id}
                  className={`seat${isOcc ? ' is-occ' : ''}${isSel ? ' is-sel' : ''}${i === 4 ? ' aisle' : ''}`}
                  onClick={() => toggle(id)}
                  disabled={isOcc}
                  aria-label={`Assento ${id}${isOcc ? ' ocupado' : ''}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="legend">
        <span><i className="dot dot--free" /> Disponível</span>
        <span><i className="dot dot--sel" /> Selecionado</span>
        <span><i className="dot dot--occ" /> Ocupado</span>
        <span className="legend__live"><i className="pix__dot" /> ao vivo</span>
      </div>

      {seats.length > 0 && (
        <div className="tickets">
          <p className="kicker">Tipo de ingresso</p>
          {ordered.map((s) => (
            <div className="trow" key={s.id}>
              <span className="trow__seat">{s.id}</span>
              <div className="seg">
                <button className={s.type === 'inteira' ? 'is-on' : ''} onClick={() => setType(s.id, 'inteira')}>
                  Inteira · R$ {movie.price}
                </button>
                <button className={s.type === 'meia' ? 'is-on' : ''} onClick={() => setType(s.id, 'meia')}>
                  Meia · R$ {meia}
                </button>
              </div>
              {s.type === 'meia' && (
                <select
                  className={`trow__cat${!s.category ? ' is-empty' : ''}`}
                  value={s.category ?? ''}
                  onChange={(e) => setCategory(s.id, e.target.value)}
                >
                  <option value="" disabled>Categoria…</option>
                  {MEIA_CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
          <p className="lawnote">
            Meia-entrada (50%) garantida por lei mediante documento comprobatório na entrada. Disponível para até 40% dos assentos.
          </p>
        </div>
      )}

      <div className="seatbar">
        <div className="seatbar__info">
          <span className="seatbar__seats">
            {seats.length === 0 ? 'Nenhum lugar selecionado' : ordered.map((s) => s.id).join(', ')}
          </span>
          <span className="seatbar__total">{seats.length} ingresso(s) = <b>R$ {total},00</b></span>
        </div>
        <button className="primary" disabled={!podeContinuar} onClick={() => onConfirm(ordered)}>
          {faltaCategoria ? 'Escolha a categoria da meia' : 'Ir para pagamento'}
        </button>
      </div>
    </section>
  );
}
