import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import type { Movie } from '../types';
import { CLASSIFICACOES } from '../types';
import { adminFetchMovies, adminSaveMovie, adminDeleteMovie, adminUploadPoster } from '../lib/db';

interface FormState {
  id?: string;
  title: string;
  genre: string;
  duration: number;
  rating: string;
  format: string;
  price: number;
  timesStr: string;
  synopsis: string;
  accent: string;
  poster_url: string | null;
  active: boolean;
}

const EMPTY: FormState = {
  title: '', genre: '', duration: 120, rating: '12', format: 'Dublado · 2D',
  price: 24, timesStr: '16:00, 19:00, 21:30', synopsis: '', accent: '#E8B23A', poster_url: null, active: true,
};

/** Sugestão simples de classificação a partir do nome (sem API externa). */
function suggestRating(title: string): string {
  const t = title.toLowerCase();
  if (/(terror|massacre|matan|sangr|er[oó]tic|sexo|18)/.test(t)) return '18';
  if (/(guerra|crime|m[aá]fia|vingan|assassin|kombat|combat)/.test(t)) return '16';
  if (/(a[cç][aã]o|thriller|suspense|heist)/.test(t)) return '14';
  if (/(infantil|crian|anima|fam[ií]lia|desenho|pets|toy|kids)/.test(t)) return 'L';
  return '12';
}

export default function AdminMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [ratingTouched, setRatingTouched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const reload = useCallback(async () => setMovies(await adminFetchMovies()), []);
  useEffect(() => { reload(); }, [reload]);

  const novo = () => { setForm(EMPTY); setRatingTouched(false); setMsg(''); };

  const editar = (m: Movie) => {
    setForm({
      id: m.id, title: m.title, genre: m.genre, duration: m.duration, rating: m.rating,
      format: m.format, price: m.price, timesStr: m.times.join(', '), synopsis: m.synopsis,
      accent: m.accent, poster_url: m.poster ?? null, active: true,
    });
    setRatingTouched(true);
    setMsg('');
  };

  const onTitle = (v: string) =>
    setForm((f) => ({ ...f, title: v, rating: ratingTouched ? f.rating : suggestRating(v) }));

  const onPoster = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    const url = await adminUploadPoster(file);
    setUploading(false);
    if (url) setForm((f) => ({ ...f, poster_url: url }));
    else setMsg('Falha ao enviar o pôster.');
  };

  const salvar = async () => {
    if (!form.title.trim()) { setMsg('Informe o nome do filme.'); return; }
    setSaving(true);
    setMsg('');
    const { error } = await adminSaveMovie({
      id: form.id,
      title: form.title.trim(),
      genre: form.genre,
      duration: Number(form.duration) || 0,
      rating: form.rating,
      synopsis: form.synopsis,
      accent: form.accent,
      format: form.format,
      poster_url: form.poster_url,
      price: Number(form.price) || 0,
      times: form.timesStr.split(',').map((t) => t.trim()).filter(Boolean),
      active: form.active,
    });
    setSaving(false);
    if (error) { setMsg(error); return; }
    setMsg(form.id ? 'Filme atualizado!' : 'Filme adicionado!');
    novo();
    reload();
  };

  const remover = async (m: Movie) => {
    if (!confirm(`Remover "${m.title}" do cartaz?`)) return;
    await adminDeleteMovie(m.id);
    if (form.id === m.id) novo();
    reload();
  };

  return (
    <div className="adm-movies">
      <div className="adm-list">
        <div className="adm-list__head">
          <h2>Filmes em cartaz ({movies.length})</h2>
          <button className="adm-newbtn" onClick={novo}>+ Novo filme</button>
        </div>
        {movies.map((m) => (
          <div key={m.id} className={`adm-row${form.id === m.id ? ' is-editing' : ''}`}>
            {m.poster ? <img src={m.poster} alt="" className="adm-row__poster" /> : <div className="adm-row__poster adm-row__poster--ph">{m.title[0]}</div>}
            <div className="adm-row__info">
              <b>{m.title}</b>
              <small>{m.rating} anos · R$ {m.price} · {m.times.length} sessões</small>
            </div>
            <div className="adm-row__actions">
              <button onClick={() => editar(m)}>Editar</button>
              <button className="adm-del" onClick={() => remover(m)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>

      <div className="adm-form">
        <h2>{form.id ? 'Editar filme' : 'Novo filme'}</h2>

        <div className="adm-form__poster">
          {form.poster_url ? <img src={form.poster_url} alt="Pôster" /> : <div className="adm-form__ph">sem pôster</div>}
          <label className="adm-upload">
            {uploading ? 'Enviando…' : 'Enviar pôster'}
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onPoster} />
          </label>
        </div>

        <label>Nome do filme
          <input type="text" value={form.title} onChange={(e) => onTitle(e.target.value)} placeholder="Ex: Duna: Parte Três" />
        </label>

        <div className="adm-form__grid">
          <label>Classificação <small>(auto)</small>
            <select value={form.rating} onChange={(e) => { setRatingTouched(true); setForm((f) => ({ ...f, rating: e.target.value })); }}>
              {CLASSIFICACOES.map((c) => <option key={c} value={c}>{c === 'L' ? 'Livre' : `${c} anos`}</option>)}
            </select>
          </label>
          <label>Preço inteira (R$)
            <input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
          </label>
          <label>Duração (min)
            <input type="number" min={0} value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))} />
          </label>
        </div>

        <label>Gênero
          <input type="text" value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))} placeholder="Ação · Aventura" />
        </label>
        <label>Formato
          <input type="text" value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))} placeholder="Dublado · 2D" />
        </label>
        <label>Horários das sessões <small>(separados por vírgula)</small>
          <input type="text" value={form.timesStr} onChange={(e) => setForm((f) => ({ ...f, timesStr: e.target.value }))} placeholder="16:00, 19:00, 21:30" />
        </label>
        <label>Sinopse
          <textarea rows={3} value={form.synopsis} onChange={(e) => setForm((f) => ({ ...f, synopsis: e.target.value }))} />
        </label>
        <label className="adm-color">Cor de destaque
          <input type="color" value={form.accent} onChange={(e) => setForm((f) => ({ ...f, accent: e.target.value }))} />
        </label>

        {msg && <p className="adm-msg">{msg}</p>}
        <div className="adm-form__actions">
          <button className="primary" onClick={salvar} disabled={saving}>{saving ? 'Salvando…' : form.id ? 'Salvar alterações' : 'Adicionar ao cartaz'}</button>
          {form.id && <button className="adm-out" onClick={novo}>Cancelar</button>}
        </div>
      </div>
    </div>
  );
}
