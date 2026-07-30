import type { Movie } from '../types';

import michael from '../assets/posters/michael.jpg';
import mortalKombat2 from '../assets/posters/mortal-kombat-2.jpg';
import diaboVestePrada2 from '../assets/posters/diabo-veste-prada-2.jpg';
import duna3 from '../assets/posters/duna-3.jpg';
import avatar3 from '../assets/posters/avatar-3.png';
import supermanLegado from '../assets/posters/superman-legado.png';

/**
 * Cartaz local — espelha `supabase/seed.sql`, mas com os pôsteres empacotados
 * pelo Vite. É o que aparece quando o Supabase não está configurado ou fora do ar,
 * para que a demonstração nunca fique com a grade vazia.
 */
export const DEMO_MOVIES: Movie[] = [
  {
    id: 'demo-michael',
    title: 'Michael',
    genre: 'Cinebiografia · Drama',
    duration: 140,
    rating: '12',
    synopsis: 'A jornada do Rei do Pop: dos palcos da infância à conquista do mundo, em uma cinebiografia vibrante.',
    accent: '#E8B23A',
    format: 'Dublado · 2D',
    poster: michael,
    price: 24,
    times: ['16:10', '18:50', '21:20'],
  },
  {
    id: 'demo-mortal-kombat-2',
    title: 'Mortal Kombat II',
    genre: 'Ação · Fantasia',
    duration: 135,
    rating: '16',
    synopsis: 'Os campeões da Terra voltam ao torneio mais letal de todos os reinos. A luta pelo destino recomeça.',
    accent: '#3FB36B',
    format: 'Legendado · 3D',
    poster: mortalKombat2,
    price: 30,
    times: ['15:40', '18:30', '21:40'],
  },
  {
    id: 'demo-diabo-veste-prada-2',
    title: 'O Diabo Veste Prada 2',
    genre: 'Comédia · Drama',
    duration: 118,
    rating: '12',
    synopsis: 'Anos depois, a moda mudou — mas Miranda Priestly continua ditando as regras. O retorno mais aguardado.',
    accent: '#D8456B',
    format: 'Dublado · 2D',
    poster: diaboVestePrada2,
    price: 24,
    times: ['17:00', '19:30'],
  },
  {
    id: 'demo-duna-3',
    title: 'Duna: Parte Três',
    genre: 'Ficção Científica',
    duration: 166,
    rating: '14',
    synopsis: 'O destino de Arrakis se completa em uma épica conclusão sobre poder, profecia e sobrevivência.',
    accent: '#C77B3B',
    format: 'Legendado · IMAX',
    poster: duna3,
    price: 34,
    times: ['16:00', '20:00'],
  },
  {
    id: 'demo-avatar-3',
    title: 'Avatar: Fogo e Cinzas',
    genre: 'Aventura · Fantasia',
    duration: 190,
    rating: '12',
    synopsis: 'A família Sully enfrenta um novo clima e novos inimigos em Pandora. Imersão visual sem igual.',
    accent: '#3AA6C9',
    format: 'Dublado · 3D',
    poster: avatar3,
    price: 30,
    times: ['15:00', '19:10'],
  },
  {
    id: 'demo-superman-legado',
    title: 'Superman: Legado',
    genre: 'Ação · Super-heróis',
    duration: 129,
    rating: '12',
    synopsis: 'Um novo começo para o Homem de Aço: esperança, identidade e a luta por um mundo melhor.',
    accent: '#4F77D9',
    format: 'Dublado · 2D',
    poster: supermanLegado,
    price: 24,
    times: ['16:40', '19:00', '21:30'],
  },
];

export function findDemoMovie(id: string): Movie | null {
  return DEMO_MOVIES.find((m) => m.id === id) ?? null;
}
