import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { Application, DIRECTIONS, STATUS, StatusKey } from '../types';

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setIsAdmin(null);
    if (!session) return;
    supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!ready) return <p className="center">Yuklanmoqda…</p>;
  if (!session) return <Login />;
  if (isAdmin === null) return <p className="center">Tekshirilmoqda…</p>;
  if (!isAdmin)
    return (
      <div className="center panel narrow">
        <h2>Ruxsat yo'q</h2>
        <p>Bu hisob admin sifatida qo'shilmagan.</p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Chiqish</button>
      </div>
    );
  return <Dashboard />;
}

function Login() {
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get('email')).trim(),
      password: String(f.get('password')),
    });
    setBusy(false);
    if (error) setErr("Email yoki parol noto'g'ri.");
  }
  return (
    <div className="center panel narrow">
      <h2>Admin kirish</h2>
      <form onSubmit={submit} className="stack">
        <label>Email<input name="email" type="email" autoComplete="username" required /></label>
        <label>Parol<input name="password" type="password" autoComplete="current-password" required /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Kirilmoqda…' : 'Kirish'}</button>
      </form>
      <Link to="/" className="muted">← Saytga qaytish</Link>
    </div>
  );
}

const fmt = (s: string) => new Date(s).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });

function Dashboard() {
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | StatusKey>('all');
  const [dir, setDir] = useState('all');
  const [toast, setToast] = useState('');

  useEffect(() => {
    supabase.from('applications').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setToast("Ma'lumotlarni yuklab bo'lmadi: " + error.message);
        setRows((data ?? []) as Application[]);
        setLoading(false);
      });
    const ch = supabase.channel('applications-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, (p) => {
        const r = p.new as Application;
        setRows((x) => [r, ...x]);
        setToast('🚀 Yangi ariza: ' + r.full_name);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const fresh = rows.filter((r) => r.status === 'yangi').length;
  useEffect(() => { document.title = fresh ? `(${fresh}) ITEX Admin` : 'ITEX Admin'; }, [fresh]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, '');
    return rows.filter((r) =>
      (status === 'all' || r.status === status) &&
      (dir === 'all' || r.direction === dir) &&
      (!s ||
        r.full_name.toLowerCase().includes(s) ||
        (r.telegram ?? '').toLowerCase().includes(s) ||
        r.direction.toLowerCase().includes(s) ||
        (digits.length > 2 && (r.phone.includes(digits) || r.parent_phone.includes(digits))))
    );
  }, [rows, q, status, dir]);

  async function patch(id: string, change: Partial<Application>) {
    setRows((x) => x.map((r) => (r.id === id ? { ...r, ...change } : r)));
    const { error } = await supabase.from('applications').update(change).eq('id', id);
    if (error) setToast('Saqlanmadi: ' + error.message);
  }
  async function remove(r: Application) {
    if (!confirm(`${r.full_name} arizasi o'chirilsinmi?`)) return;
    const { error } = await supabase.from('applications').delete().eq('id', r.id);
    if (error) setToast("O'chirilmadi: " + error.message);
    else setRows((x) => x.filter((y) => y.id !== r.id));
  }

  return (
    <div className="wrap adm">
      <div className="bar">
        <h1 className="logo">ITEX Admin</h1>
        <div className="row">
          <Link className="btn ghost small" to="/">Sayt</Link>
          <button className="btn ghost small" onClick={() => supabase.auth.signOut()}>Chiqish</button>
        </div>
      </div>

      <div className="stats">
        <div className="panel"><b>{rows.length}</b>Jami arizalar</div>
        <div className="panel"><b>{fresh}</b>Yangi</div>
        <div className="panel"><b>{rows.filter((r) => r.status === 'qabul_qilindi').length}</b>Qabul qilingan</div>
      </div>

      <div className="filters">
        <input type="search" placeholder="Ism, telefon yoki Telegram bo'yicha qidirish" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | StatusKey)}>
          <option value="all">Barcha holatlar</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={dir} onChange={(e) => setDir(e.target.value)}>
          <option value="all">Barcha yo'nalishlar</option>
          {DIRECTIONS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading ? <p className="muted">Yuklanmoqda…</p> : list.length === 0 ? (
        <p className="muted">{rows.length ? "Qidiruv bo'yicha ariza topilmadi." : "Hali ariza yo'q. Yangi ariza kelganda shu yerda ko'rinadi."}</p>
      ) : (
        <div className="apps">
          {list.map((r) => (
            <article className="panel app" key={r.id} data-status={r.status}>
              <div className="head">
                <div>
                  <h3>{r.full_name}</h3>
                  <span className="muted">{r.grade}-sinf · {r.direction} · {fmt(r.created_at)}</span>
                </div>
                <select className="st" value={r.status} onChange={(e) => patch(r.id, { status: e.target.value as StatusKey })} aria-label="Aloqa holati">
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="links">
                <a href={`tel:${r.phone}`}>📞 {r.phone}</a>
                <a href={`tel:${r.parent_phone}`}>👨‍👩‍👧 {r.parent_phone}</a>
                {r.telegram && <a href={`https://t.me/${r.telegram.replace('@', '')}`} target="_blank" rel="noreferrer">✈️ {r.telegram}</a>}
              </div>
              <textarea placeholder="Izoh (masalan: ertaga qo'ng'iroq qilaman)" defaultValue={r.note ?? ''} maxLength={500} rows={2}
                onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== r.note) patch(r.id, { note: v }); }} />
              <button className="del" onClick={() => remove(r)}>O'chirish</button>
            </article>
          ))}
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
