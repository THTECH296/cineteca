export interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: number;        // minutos
  rating: string;          // L/10/12/14/16/18
  synopsis: string;
  accent: string;
  format: string;
  poster?: string;         // URL do pôster (Supabase Storage)
  price: number;           // valor da inteira, em reais
  times: string[];         // horários das sessões
}

export interface DaySession {
  date: string;
  weekday: string;
  isToday: boolean;
  times: string[];
}

export type TicketType = 'inteira' | 'meia';

export interface SeatChoice {
  id: string;
  type: TicketType;
  category?: string;
}

export interface Selection {
  movie: Movie;
  date: string;
  weekday: string;
  time: string;
  seats: SeatChoice[];
}

export type Step = 'cartaz' | 'sessao' | 'auth' | 'assentos' | 'pagamento' | 'confirmado';

// Categorias com direito a meia-entrada (Lei 12.933/2013 e correlatas)
export const MEIA_CATEGORIAS = [
  'Estudante',
  'Idoso (60+)',
  'PCD + acompanhante',
  'Professor(a) da rede pública',
  'ID Jovem (15–29, baixa renda)',
  'Doador de sangue',
];

export const CLASSIFICACOES = ['L', '10', '12', '14', '16', '18'];

export function precoAssento(type: TicketType, base: number): number {
  return type === 'meia' ? base / 2 : base;
}

export function totalAssentos(seats: SeatChoice[], base: number): number {
  return seats.reduce((sum, s) => sum + precoAssento(s.type, base), 0);
}
