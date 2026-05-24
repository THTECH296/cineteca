do $$
declare b text := 'https://kknklriuymksdscozukf.supabase.co/storage/v1/object/public/posters/';
begin
  if not exists (select 1 from public.movies) then
    insert into public.movies (title, genre, duration, rating, synopsis, accent, format, poster_url, price, times) values
    ('Michael', 'Cinebiografia · Drama', 140, '12', 'A jornada do Rei do Pop: dos palcos da infância à conquista do mundo, em uma cinebiografia vibrante.', '#E8B23A', 'Dublado · 2D', b || 'michael.jpg', 24, array['16:10','18:50','21:20']),
    ('Mortal Kombat II', 'Ação · Fantasia', 135, '16', 'Os campeões da Terra voltam ao torneio mais letal de todos os reinos. A luta pelo destino recomeça.', '#3FB36B', 'Legendado · 3D', b || 'mortal-kombat-2.jpg', 30, array['15:40','18:30','21:40']),
    ('O Diabo Veste Prada 2', 'Comédia · Drama', 118, '12', 'Anos depois, a moda mudou — mas Miranda Priestly continua ditando as regras. O retorno mais aguardado.', '#D8456B', 'Dublado · 2D', b || 'diabo-veste-prada-2.jpg', 24, array['17:00','19:30']),
    ('Duna: Parte Três', 'Ficção Científica', 166, '14', 'O destino de Arrakis se completa em uma épica conclusão sobre poder, profecia e sobrevivência.', '#C77B3B', 'Legendado · IMAX', b || 'duna-3.jpg', 34, array['16:00','20:00']),
    ('Avatar: Fogo e Cinzas', 'Aventura · Fantasia', 190, '12', 'A família Sully enfrenta um novo clima e novos inimigos em Pandora. Imersão visual sem igual.', '#3AA6C9', 'Dublado · 3D', b || 'avatar-3.png', 30, array['15:00','19:10']),
    ('Superman: Legado', 'Ação · Super-heróis', 129, '12', 'Um novo começo para o Homem de Aço: esperança, identidade e a luta por um mundo melhor.', '#4F77D9', 'Dublado · 2D', b || 'superman-legado.png', 24, array['16:40','19:00','21:30']);
  end if;
end $$;
