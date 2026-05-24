import type { DaySession } from '../types';

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function currentHHMM(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

/** Gera as sessões (hoje + próximos 3 dias) a partir dos horários do filme. */
export function sessionsFor(times: string[]): DaySession[] {
  const base = times.length ? times : ['18:00', '20:30'];
  const days: DaySession[] = [];
  const today = new Date();

  for (let i = 0; i < 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      date: iso,
      weekday: WEEKDAYS[d.getDay()],
      isToday: i === 0,
      times: i === 0 ? base.filter((t) => t >= currentHHMM()) : [...base],
    });
  }
  if (days[0].times.length === 0) days[0].times = base.slice(-1);
  return days;
}

export function formatBRDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
