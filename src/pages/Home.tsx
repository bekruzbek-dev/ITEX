import { FormEvent, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { DIRECTIONS, DIRECTION_INFO } from '../types';

const phoneRe = /^\+?[0-9]{9,13}$/;
const tgRe = /^@?[A-Za-z0-9_]{4,32}$/;
const strip = (s: string) => s.replace(/[\s\-()]/g, '');
// 901234567 / 998901234567 / +998901234567 -> bir xil ko'rinish (takroriy arizalarni to'g'ri aniqlash uchun)
const norm = (s: string) => {
  const d = strip(s).replace(/\D/g, '');
  if (d.length === 9) return '+998' + d;
  if (d.length === 12 && d.startsWith('998')) return '+' + d;
  return strip(s);
};

export default function Home() {
  const [direction, setDirection] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const formRef = useRef<HTMLElement>(null);

  const pick = (d: string) => {
    setDirection(d);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get('website')) return setState('done'); // spam tuzog'i (honeypot)

    const full_name = String(f.get('full_name') || '').trim().replace(/\s+/g, ' ');
    const phone = norm(String(f.get('phone') || ''));
    const parent_phone = norm(String(f.get('parent_phone') || ''));
    const tgRaw = String(f.get('telegram') || '').trim();
    const grade = Number(f.get('grade'));

    if (full_name.length < 3) return setError("Ism va familiyangizni to'liq yozing.");
    if (!grade) return setError('Sinfingizni tanlang.');
    if (!direction) return setError("Yo'nalishni tanlang.");
    if (!phoneRe.test(phone)) return setError("Telefon raqamingiz noto'g'ri. Masalan: +998901234567");
    if (!phoneRe.test(parent_phone)) return setError("Ota-ona raqami noto'g'ri. Masalan: +998901234567");
    if (tgRaw && !tgRe.test(tgRaw)) return setError("Telegram username noto'g'ri. Masalan: @itex_uz");

    setError('');
    setState('sending');
    const { error: err } = await supabase.from('applications').insert({
      full_name,
      grade,
      direction,
      phone,
      parent_phone,
      telegram: tgRaw ? '@' + tgRaw.replace('@', '') : null,
    });
    if (err) {
      setState('idle');
      if (err.code === '23505')
        return setError("Bu telefon raqami bilan shu yo'nalishga ariza allaqachon yuborilgan. Tez orada bog'lanamiz.");
      if (err.message.includes("Juda ko'p"))
        return setError("Hozir arizalar juda ko'p kelyapti. Bir necha daqiqadan keyin qayta urinib ko'ring.");
      return setError("Ariza yuborilmadi. Internetni tekshirib, qayta urinib ko'ring.");
    }
    setState('done');
  }

  return (
    <>
      <header className="wrap top">
        <a className="logo" href="#top">ITEX 🚀</a>
        <nav>
          <a href="#yonalishlar">Yo'nalishlar</a>
          <a className="btn small" href="#ariza">Ariza qoldirish</a>
        </nav>
      </header>

      <main id="top">
        <section className="wrap hero">
          <div>
            <h1>Kod yozing.<br />Dizayn qiling.<br />Ishga tushiring.</h1>
            <p className="lead">
              ITEX — 1-sinfdan 11-sinfgacha barcha o'quvchilar uchun IT to'garagi. Qiziqishingiz bo'yicha yo'nalish tanlang va birinchi loyihangizni yarating.
            </p>
            <div className="row">
              <a className="btn" href="#ariza">Ariza qoldirish</a>
              <a className="btn ghost" href="#yonalishlar">Yo'nalishlarni ko'rish</a>
            </div>
          </div>
          <pre className="code" aria-hidden="true">
            <span><i>const</i> itex = {'{'}</span>
            <span>{'  '}sinflar: <b>"1–11"</b>,</span>
            <span>{'  '}yonalishlar: <b>4</b>,</span>
            <span>{'  '}ariza: <b>"ochiq"</b>,</span>
            <span>{'}'};</span>
            <span><i>launch</i>(itex); 🚀</span>
          </pre>
        </section>

        <section className="wrap" id="yonalishlar">
          <h2>To'rtta yo'nalish</h2>
          <div className="dirs">
            {DIRECTIONS.map((d) => (
              <button key={d} className="dir" style={{ ['--c' as string]: DIRECTION_INFO[d].color }} onClick={() => pick(d)}>
                <span className="emoji">{DIRECTION_INFO[d].emoji}</span>
                <h3>{d}</h3>
                <p>{DIRECTION_INFO[d].text}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="wrap" id="ariza" ref={formRef}>
          <div className="panel formbox">
            <h2>Ariza qoldiring</h2>
            {state === 'done' ? (
              <div className="done" role="status">
                <div className="big">🎉</div>
                <h3>Arizangiz qabul qilindi</h3>
                <p>Tez orada siz yoki ota-onangiz bilan telefon orqali bog'lanamiz.</p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <label>Ism va familiya
                  <input name="full_name" autoComplete="name" maxLength={80} required />
                </label>
                <label>Sinf
                  <select name="grade" defaultValue="">
                    <option value="" disabled>Tanlang</option>
                    {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}-sinf</option>)}
                  </select>
                </label>
                <label className="full">Yo'nalish
                  <select value={direction} onChange={(e) => setDirection(e.target.value)}>
                    <option value="" disabled>Tanlang</option>
                    {DIRECTIONS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </label>
                <label>Telefon raqamingiz
                  <input name="phone" type="tel" inputMode="tel" placeholder="+998 90 123 45 67" autoComplete="tel" />
                </label>
                <label>Telegram (ixtiyoriy)
                  <input name="telegram" placeholder="@username" autoCapitalize="none" />
                </label>
                <label className="full">Ota-ona telefon raqami
                  <input name="parent_phone" type="tel" inputMode="tel" placeholder="+998 90 123 45 67" />
                </label>
                <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                {error && <p className="err full" role="alert">{error}</p>}
                <button className="btn full" disabled={state === 'sending'}>
                  {state === 'sending' ? 'Yuborilmoqda…' : 'Arizani yuborish'}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="wrap foot">
        <span>© {new Date().getFullYear()} ITEX IT to'garagi</span>
        <Link to="/admin">Admin</Link>
      </footer>
    </>
  );
}
