import { useCallback, useEffect, useState } from 'react';
import type { Movie, SeatChoice } from '../types';
import { totalAssentos } from '../types';
import { formatBRDate } from '../data/movies';
import { supabase } from '../lib/supabase';
import Poster from './Poster';

interface Props {
  movie: Movie;
  date: string;
  weekday: string;
  time: string;
  seats: SeatChoice[];
  onBack: () => void;
  onPaid: () => void;
}

interface PixCharge {
  id: string;
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
}

export default function Payment({ movie, date, weekday, time, seats, onBack, onPaid }: Props) {
  const total = totalAssentos(seats, movie.price);
  const inteiras = seats.filter((s) => s.type === 'inteira').length;
  const meias = seats.filter((s) => s.type === 'meia').length;
  const [tab, setTab] = useState<'pix' | 'cartao'>('pix');

  // ── PIX (real, via Edge Function + AbacatePay) ──
  const [pix, setPix] = useState<PixCharge | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState('');
  const [secsLeft, setSecsLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const createPix = useCallback(async () => {
    if (!supabase) {
      setPixError('Supabase não configurado.');
      return;
    }
    setPixLoading(true);
    setPixError('');
    const { data, error } = await supabase.functions.invoke('pix', {
      body: { action: 'create', amount: total * 100, description: `Ingresso CineTeca — ${movie.title}` },
    });
    setPixLoading(false);
    if (error || !data || data.error) {
      setPixError(data?.error || error?.message || 'Não foi possível gerar a cobrança PIX.');
      return;
    }
    setPix(data as PixCharge);
  }, [total, movie.title]);

  useEffect(() => {
    if (tab === 'pix' && !pix && !pixLoading && !pixError) createPix();
  }, [tab, pix, pixLoading, pixError, createPix]);

  useEffect(() => {
    if (!pix) return;
    const end = new Date(pix.expiresAt).getTime();
    const tick = () => setSecsLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pix]);

  const expired = !!pix && secsLeft === 0;

  useEffect(() => {
    if (!pix || tab !== 'pix' || expired) return;
    let stop = false;
    const id = setInterval(async () => {
      const { data } = await supabase!.functions.invoke('pix', { body: { action: 'check', id: pix.id } });
      if (!stop && data?.status === 'PAID') {
        clearInterval(id);
        onPaid();
      }
    }, 4000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [pix, tab, expired, onPaid]);

  const copyPix = async () => {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.brCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard indisponível */
    }
  };

  const simulatePayment = async () => {
    if (!pix || !supabase) return;
    setSimulating(true);
    await supabase.functions.invoke('pix', { body: { action: 'simulate', id: pix.id } });
    const { data } = await supabase.functions.invoke('pix', { body: { action: 'check', id: pix.id } });
    setSimulating(false);
    if (data?.status === 'PAID') onPaid();
  };

  const regenerate = () => {
    setPix(null);
    setPixError('');
  };

  const mmss = `${Math.floor(secsLeft / 60)}:${String(secsLeft % 60).padStart(2, '0')}`;

  // ── Cartão (checkout hospedado AbacatePay, com redirect) ──
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState('');

  const payCardHosted = async () => {
    if (!supabase) return;
    setCardError('');
    setCardLoading(true);
    const back = window.location.origin + window.location.pathname;
    const { data, error } = await supabase.functions.invoke('pix', {
      body: { action: 'card', amount: total * 100, description: `Ingresso CineTeca — ${movie.title}`, returnUrl: back, completionUrl: back },
    });
    if (error || !data?.url) {
      setCardLoading(false);
      setCardError(data?.error || error?.message || 'Não foi possível iniciar o pagamento.');
      return;
    }
    localStorage.setItem(
      'cineteca_card_pending',
      JSON.stringify({ checkoutId: data.id, movieId: movie.id, date, weekday, time, seats }),
    );
    window.location.href = data.url;
  };

  return (
    <section className="pay">
      <button className="back" onClick={onBack}>← Trocar lugares</button>
      <p className="kicker">Pagamento</p>
      <h1 className="title">Finalize sua compra</h1>

      <div className="pay__layout">
        <aside className="pay__resume">
          <Poster movie={movie} size="sm" />
          <h2>{movie.title}</h2>
          <ul className="pay__lines">
            <li><span>Sessão</span><b>{weekday}, {formatBRDate(date)}</b></li>
            <li><span>Horário</span><b>{time}</b></li>
            <li><span>Lugares</span><b>{seats.map((s) => s.id).join(', ')}</b></li>
            {inteiras > 0 && <li><span>Inteira</span><b>{inteiras} × R$ {movie.price}</b></li>}
            {meias > 0 && <li><span>Meia-entrada</span><b>{meias} × R$ {movie.price / 2}</b></li>}
          </ul>
          <div className="pay__total"><span>Total</span><b>R$ {total},00</b></div>
        </aside>

        <div className="pay__methods">
          <div className="paytabs">
            <button className={tab === 'pix' ? 'is-active' : ''} onClick={() => setTab('pix')}>PIX</button>
            <button className={tab === 'cartao' ? 'is-active' : ''} onClick={() => setTab('cartao')}>Cartão de crédito</button>
          </div>

          {tab === 'pix' ? (
            pixError ? (
              <div className="pix-expired">
                <div className="pix-expired__ic">⚠</div>
                <h3>Erro ao gerar PIX</h3>
                <p>{pixError}</p>
                <button className="primary" onClick={regenerate}>Tentar novamente</button>
              </div>
            ) : pixLoading || !pix ? (
              <div className="pix"><div className="pix__qr pix__qr--load" /><p className="pix__hint" style={{ marginTop: 16 }}>Gerando cobrança PIX…</p></div>
            ) : expired ? (
              <div className="pix-expired">
                <div className="pix-expired__ic">⏱</div>
                <h3>PIX expirado</h3>
                <p>O tempo para pagamento acabou. Gere um novo código para continuar.</p>
                <button className="primary" onClick={regenerate}>Gerar novo código PIX</button>
              </div>
            ) : (
              <div className="pix">
                <span className="pix__badge">🧪 Cobrança de teste · modo dev</span>
                <p className="pix__hint">
                  QR Code e código gerados de verdade pela AbacatePay. Expira em{' '}
                  <b className={secsLeft <= 60 ? 'pix__timer is-low' : 'pix__timer'}>{mmss}</b>
                </p>
                <div className="pix__qrwrap">
                  <img className="pix__qr" src={pix.brCodeBase64} alt="QR Code PIX" />
                </div>
                <div className="pix__code"><code>{pix.brCode}</code></div>
                <button className="primary" onClick={copyPix}>{copied ? '✓ Código copiado!' : 'Copiar código PIX'}</button>
                <div className="pix__waiting"><span className="pix__dot" /> Aguardando confirmação do pagamento…</div>
                <button className="btn-sim" onClick={simulatePayment} disabled={simulating}>
                  {simulating ? 'Confirmando…' : '✓ Simular pagamento (modo teste)'}
                </button>
                <p className="pix__note">No modo dev o QR não é pago por bancos reais — use “Simular pagamento” para concluir. Em produção, é pago no app do banco e confirmado por webhook.</p>
              </div>
            )
          ) : (
            <div className="hosted">
              <div className="hosted__ic">🔒</div>
              <h3 className="hosted__title">Pagamento seguro com cartão</h3>
              <p className="hosted__txt">
                Você será levado ao ambiente seguro do <b>AbacatePay</b> para inserir os dados do cartão.
                Por segurança (PCI), eles não passam pelo nosso site.
              </p>
              {cardError && <p className="cardf__error">⚠ {cardError}</p>}
              <button className="primary" onClick={payCardHosted} disabled={cardLoading}>
                {cardLoading ? 'Redirecionando…' : `Pagar R$ ${total},00 no cartão →`}
              </button>
              <p className="pix__note">Checkout hospedado AbacatePay · ambiente de teste. Após pagar, você volta automaticamente e o ingresso é liberado.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
