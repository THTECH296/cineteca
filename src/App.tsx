import { useEffect, useState } from 'react';
import type { Movie, Step, Selection, SeatChoice } from './types';
import { totalAssentos } from './types';
import { useAuth } from './auth/AuthContext';
import { fetchMovies, getMovie, createOrder } from './lib/db';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import Cartaz from './components/Cartaz';
import SessionView from './components/SessionView';
import Auth from './components/Auth';
import SeatMap from './components/SeatMap';
import Payment from './components/Payment';
import Confirmation from './components/Confirmation';

interface SessionPick {
  date: string;
  weekday: string;
  time: string;
}

export default function App() {
  const { user, loading } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [step, setStep] = useState<Step>('cartaz');
  const [movie, setMovie] = useState<Movie | null>(null);
  const [session, setSession] = useState<SessionPick | null>(null);
  const [seats, setSeats] = useState<SeatChoice[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);

  // carrega o cartaz do banco
  useEffect(() => {
    fetchMovies().then(setMovies);
  }, []);

  // grava o pedido e vai pro ingresso
  const confirmPurchase = async (sel: Selection, method: string) => {
    if (user) {
      await createOrder({
        userId: user.id,
        movieId: sel.movie.id,
        movieTitle: sel.movie.title,
        date: sel.date,
        time: sel.time,
        seats: sel.seats,
        amount: totalAssentos(sel.seats, sel.movie.price),
        method,
      });
    }
    setSelection(sel);
    setStep('confirmado');
  };

  // avança ao logar no gate
  useEffect(() => {
    if (step === 'auth' && user) setStep('assentos');
  }, [user, step]);

  // retorno do checkout de cartão (AbacatePay)
  useEffect(() => {
    if (loading) return;
    const raw = localStorage.getItem('cineteca_card_pending');
    if (!raw) return;
    localStorage.removeItem('cineteca_card_pending');
    let p: { checkoutId: string; movieId: string; date: string; weekday: string; time: string; seats: SeatChoice[] };
    try {
      p = JSON.parse(raw);
    } catch {
      return;
    }
    if (!supabase) return;
    (async () => {
      const { data } = await supabase!.functions.invoke('pix', { body: { action: 'card-status', id: p.checkoutId } });
      if (data?.status !== 'PAID') return;
      const m = await getMovie(p.movieId);
      if (!m) return;
      confirmPurchase({ movie: m, date: p.date, weekday: p.weekday, time: p.time, seats: p.seats }, 'card');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const reset = () => {
    setStep('cartaz');
    setMovie(null);
    setSession(null);
    setSeats([]);
    setSelection(null);
  };

  return (
    <>
      <Header step={step} onHome={reset} />
      <div className="app">
        <main className="main" key={step}>
          {step === 'cartaz' && <Cartaz movies={movies} onPick={(m) => { setMovie(m); setStep('sessao'); }} />}

          {step === 'sessao' && movie && (
            <SessionView
              movie={movie}
              onBack={() => setStep('cartaz')}
              onConfirm={(date, weekday, time) => {
                setSession({ date, weekday, time });
                setStep(user ? 'assentos' : 'auth');
              }}
            />
          )}

          {step === 'auth' && movie && session && (
            <Auth movie={movie} {...session} onBack={() => setStep('sessao')} />
          )}

          {step === 'assentos' && movie && session && (
            <SeatMap
              movie={movie}
              date={session.date}
              time={session.time}
              onBack={() => setStep('sessao')}
              onConfirm={(s) => { setSeats(s); setStep('pagamento'); }}
            />
          )}

          {step === 'pagamento' && movie && session && (
            <Payment
              movie={movie}
              {...session}
              seats={seats}
              onBack={() => setStep('assentos')}
              onPaid={() => confirmPurchase({ movie, ...session, seats }, 'pix')}
            />
          )}

          {step === 'confirmado' && selection && <Confirmation selection={selection} onNew={reset} />}
        </main>

        <footer className="ft">
          CineTeca © {new Date().getFullYear()} · Teófilo Otoni — MG · Projeto demonstrativo
        </footer>
      </div>
    </>
  );
}
