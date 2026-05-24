import type { CSSProperties } from 'react';
import type { Movie } from '../types';

interface Props {
  movie: Movie;
  size?: 'sm' | 'md';
}

/** Pôster do filme: usa a imagem real quando disponível, senão uma key-art gerada por CSS. */
export default function Poster({ movie, size = 'md' }: Props) {
  const style = { '--accent': movie.accent } as CSSProperties;

  return (
    <div className={`poster poster--${size}${movie.poster ? ' poster--photo' : ''}`} style={style}>
      <span className="poster__rating">{movie.rating}</span>

      {movie.poster ? (
        <img className="poster__img" src={movie.poster} alt={`Pôster de ${movie.title}`} loading="lazy" />
      ) : (
        <>
          <div className="poster__art" aria-hidden="true">
            <span className="poster__glyph">{movie.title.charAt(0)}</span>
          </div>
          <div className="poster__info">
            <span className="poster__format">{movie.format}</span>
            <h3 className="poster__title">{movie.title}</h3>
          </div>
        </>
      )}
    </div>
  );
}
