import { useState, type CSSProperties } from 'react';
import type { Movie } from '../types';
import Poster from './Poster';

interface Props {
  movies: Movie[];
  /** Cartaz local (Supabase fora do ar): compra e login ficam indisponíveis. */
  demo?: boolean;
  onPick: (movie: Movie) => void;
}

export default function Cartaz({ movies, demo = false, onPick }: Props) {
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;

  const filtered = movies.filter((m) =>
    (m.title + m.genre).toLowerCase().includes(query.toLowerCase().trim()),
  );
  const featured = movies[0];

  return (
    <section className="cartaz">
      {/* Banner de destaque */}
      {featured && !searching && (
        <div className="feature" style={{ '--accent': featured.accent } as CSSProperties}>
          {featured.poster && <div className="feature__bg" style={{ backgroundImage: `url(${featured.poster})` }} />}
          <div className="feature__inner">
            {featured.poster
              ? <img className="feature__poster" src={featured.poster} alt={featured.title} />
              : <div className="feature__poster" />}
            <div className="feature__info">
              <span className="feature__tag">✦ Estreia em destaque</span>
              <h1 className="feature__title">{featured.title}</h1>
              <div className="feature__meta">
                <span className="feature__rating">{featured.rating}</span>
                <span>{featured.genre}</span><span>·</span><span>{featured.duration} min</span><span>·</span><span>{featured.format}</span>
              </div>
              <p className="feature__syn">{featured.synopsis}</p>
              <div className="feature__cta">
                <button className="btn-feature" onClick={() => onPick(featured)}>Comprar ingresso →</button>
                <span className="feature__price">a partir de <b>R$ {featured.price}</b></span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="cartaz__head">
        <div>
          <p className="kicker">
            {searching ? 'Resultados' : 'Em cartaz · hoje'}
            {demo && !searching && <span className="demo-pill" title="O banco de dados não respondeu — exibindo o cartaz local.">Modo demonstração</span>}
          </p>
          <h2 className="sec display">{searching ? `“${query}”` : 'Todos os filmes'}</h2>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Buscar filme ou gênero…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar filme"
        />
      </div>

      {movies.length === 0 ? (
        <div className="grid">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="card-skel" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="empty">Nenhum filme encontrado para “{query}”.</p>
      ) : (
        <div className="grid">
          {filtered.map((movie, i) => (
            <button key={movie.id} className="card" style={{ '--accent': movie.accent, animationDelay: `${Math.min(i, 8) * 50}ms` } as CSSProperties} onClick={() => onPick(movie)}>
              <div className="card__poster">
                <Poster movie={movie} />
                <span className="card__buy">Comprar ingresso</span>
              </div>
              <div className="card__body">
                <h3 className="card__title">{movie.title}</h3>
                <p className="card__meta">{movie.genre} · {movie.duration} min</p>
                <span className="card__price">R$ {movie.price}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
