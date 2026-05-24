import { useMemo, useState } from 'react';
import type { Movie } from '../types';
import { sessionsFor, formatBRDate } from '../data/movies';
import Poster from './Poster';

interface Props {
  movie: Movie;
  onBack: () => void;
  onConfirm: (date: string, weekday: string, time: string) => void;
}

export default function SessionView({ movie, onBack, onConfirm }: Props) {
  const days = useMemo(() => sessionsFor(movie.times), [movie.times]);
  const [dayIndex, setDayIndex] = useState(0);
  const [time, setTime] = useState<string | null>(null);

  const day = days[dayIndex];

  return (
    <section className="sessao">
      <button className="back" onClick={onBack}>← Voltar ao cartaz</button>

      <div className="sessao__layout">
        <aside className="sessao__movie">
          <Poster movie={movie} size="sm" />
          <h2>{movie.title}</h2>
          <p className="sessao__genre">{movie.genre}</p>
          <p className="sessao__syn">{movie.synopsis}</p>
          <ul className="chips">
            <li>{movie.rating} anos</li>
            <li>{movie.duration} min</li>
            <li>{movie.format}</li>
          </ul>
        </aside>

        <div className="sessao__pick">
          <p className="kicker">Escolha o dia</p>
          <div className="days">
            {days.map((d, i) => (
              <button
                key={d.date}
                className={`day${i === dayIndex ? ' is-active' : ''}`}
                onClick={() => { setDayIndex(i); setTime(null); }}
              >
                <small>{d.isToday ? 'HOJE' : d.weekday.slice(0, 3).toUpperCase()}</small>
                <b>{formatBRDate(d.date).slice(0, 5)}</b>
              </button>
            ))}
          </div>

          <p className="kicker" style={{ marginTop: 26 }}>
            {day.weekday} · {formatBRDate(day.date)}
          </p>
          <div className="times">
            {day.times.map((t) => (
              <button
                key={t}
                className={`time${t === time ? ' is-active' : ''}`}
                onClick={() => setTime(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            className="primary"
            disabled={!time}
            onClick={() => time && onConfirm(day.date, day.weekday, time)}
          >
            {time ? `Escolher lugares · ${time}` : 'Selecione um horário'}
          </button>
        </div>
      </div>
    </section>
  );
}
