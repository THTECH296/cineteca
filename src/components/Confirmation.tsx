import type { CSSProperties } from 'react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { Selection } from '../types';
import { totalAssentos } from '../types';
import { formatBRDate } from '../data/movies';

interface Props {
  selection: Selection;
  onNew: () => void;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export default function Confirmation({ selection, onNew }: Props) {
  const { movie, date, weekday, time, seats } = selection;
  const total = totalAssentos(seats, movie.price);
  const meias = seats.filter((s) => s.type === 'meia').length;
  const code = (movie.id.slice(0, 3) + date.replace(/-/g, '') + time.replace(':', '')).toUpperCase().slice(0, 12);

  const downloadPdf = async () => {
    const W = 340;
    const H = 560;
    const doc = new jsPDF({ unit: 'pt', format: [W, H] });
    const ac = hexToRgb(movie.accent);

    doc.setFillColor(11, 11, 16);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(ac[0], ac[1], ac[2]);
    doc.rect(0, 0, W, 7, 'F');

    doc.setTextColor(ac[0], ac[1], ac[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CINETECA · TEÓFILO OTONI - MG', 26, 46);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    const titleLines = doc.splitTextToSize(movie.title, W - 52) as string[];
    doc.text(titleLines, 26, 74);
    let y = 74 + titleLines.length * 24 + 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 165);
    doc.text(`${movie.format} · ${movie.rating} anos`, 26, y);
    y += 26;

    const rows: [string, string][] = [
      ['Dia', `${weekday}, ${formatBRDate(date)}`],
      ['Sessão', time],
      ['Lugares', seats.map((s) => s.id).join(', ')],
    ];
    if (meias > 0) rows.push(['Meia-entrada', `${meias} de ${seats.length}`]);
    rows.push(['Total', `R$ ${total},00`]);

    doc.setDrawColor(40, 40, 52);
    rows.forEach(([k, v]) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 165);
      doc.text(k, 26, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(v, W - 26, y, { align: 'right' });
      doc.line(26, y + 9, W - 26, y + 9);
      y += 30;
    });

    const qrData = await QRCode.toDataURL(code, { margin: 1, width: 240, color: { dark: '#0b0b10', light: '#ffffff' } });
    const qs = 128;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(W / 2 - qs / 2 - 8, y + 6, qs + 16, qs + 16, 8, 8, 'F');
    doc.addImage(qrData, 'PNG', W / 2 - qs / 2, y + 14, qs, qs);
    y += qs + 40;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(180, 180, 195);
    doc.text(code, W / 2, y, { align: 'center' });
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 135);
    doc.text('Apresente este ingresso na entrada da sala.', W / 2, y, { align: 'center' });

    doc.save(`ingresso-cineteca-${code}.pdf`);
  };

  return (
    <section className="confirm">
      <div className="confirm__check">✓</div>
      <h1 className="title">Compra confirmada!</h1>
      <p className="confirm__sub">Apresente este ingresso na entrada da sala.</p>

      <div className="ticket" style={{ '--accent': movie.accent } as CSSProperties}>
        <div className="ticket__main">
          <p className="ticket__cine">CINETECA · TEÓFILO OTONI</p>
          <h2 className="ticket__movie">{movie.title}</h2>
          <p className="ticket__fmt">{movie.format} · {movie.rating} anos</p>

          <div className="ticket__rows">
            <div><span>Dia</span><b>{weekday}, {formatBRDate(date)}</b></div>
            <div><span>Sessão</span><b>{time}</b></div>
            <div><span>Lugares</span><b>{seats.map((s) => s.id).join(', ')}</b></div>
            {meias > 0 && <div><span>Meia-entrada</span><b>{meias} de {seats.length}</b></div>}
            <div><span>Total</span><b>R$ {total},00</b></div>
          </div>
        </div>

        <div className="ticket__stub">
          <div className="ticket__qr" aria-hidden="true" />
          <span className="ticket__code">{code}</span>
        </div>
      </div>

      <div className="confirm__actions">
        <button className="primary" onClick={downloadPdf}>⬇ Baixar ingresso (PDF)</button>
        <button className="primary primary--ghost" onClick={onNew}>Comprar outro ingresso</button>
      </div>
    </section>
  );
}
