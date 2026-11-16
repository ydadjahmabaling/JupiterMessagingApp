import { useState } from 'react';
import api, { errMsg } from '../api';

const deviceId = (() => {
  let d = localStorage.getItem('jm_device');
  if (!d) { d = crypto.randomUUID(); localStorage.setItem('jm_device', d); }
  return d;
})();

function Planet() {
  return (
    <div className="relative w-56 h-56 md:w-72 md:h-72 mx-auto">
      <div className="absolute -inset-10 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="relative w-full h-full rounded-full shadow-glow"
        style={{
          background:
            'radial-gradient(circle at 30% 28%, rgba(255,255,255,.35), transparent 38%),' +
            'repeating-linear-gradient(172deg,#c98b4d 0 9%,#f1d2a0 9% 15%,#a85d34 15% 21%,#e8b878 21% 30%,#8f4a2b 30% 34%,#f4dfba 34% 44%,#b87445 44% 52%)',
          boxShadow: 'inset -40px -30px 70px rgba(10,6,30,.85), 0 0 60px rgba(255,170,60,.35)',
        }}>
        <div className="absolute left-[58%] top-[56%] w-12 h-7 md:w-16 md:h-9 rounded-[50%] bg-[#b4442c]/80 blur-[1px]" />
      </div>
    </div>
  );
}

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ identifier: '', email: '', username: '', password: '', code: '' });
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const handle = (r) => {
    if (r.needsVerification) {
      setF((p) => ({ ...p, email: r.email, code: '' }));
      setInfo('We generated a 6-digit code. In dev mode it is printed in the Spring Boot console.');
      setMode('verify');
    } else onAuth(r.token);
  };

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = mode === 'login' ? await api.post('/auth/login', { identifier: f.identifier, password: f.password, deviceId })
        : mode === 'register' ? await api.post('/auth/register', { email: f.email, username: f.username, password: f.password })
        : await api.post('/auth/verify', { email: f.email, code: f.code, deviceId });
      handle(r.data);
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  const resend = async () => {
    try { await api.post('/auth/resend', { email: f.email }); setInfo('New code generated - check the console.'); setErr(''); }
    catch (x) { setErr(errMsg(x)); }
  };

  return (
    <div className="min-h-full stars flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 items-center">
        <div className="text-center hidden md:block">
          <Planet />
          <h1 className="font-display font-extrabold text-4xl mt-10 tracking-tight">Jupiter Messaging</h1>
          <p className="text-slate-400 mt-2">Servers, DMs and notes, orbiting in real time.</p>
        </div>
        <form onSubmit={submit} className="bg-space-800/90 border border-space-500 rounded-2xl p-8 shadow-violet backdrop-blur">
          <h2 className="font-display font-bold text-2xl mb-1">
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Enter your code'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {mode === 'verify' ? `Code sent to ${f.email}` : mode === 'login' ? 'Log in to continue.' : 'Join the crew in under a minute.'}
          </p>
          <div className="space-y-3">
            {mode === 'login' && (<>
              <input className="input" placeholder="Email or username" value={f.identifier} onChange={set('identifier')} autoFocus />
              <input className="input" type="password" placeholder="Password" value={f.password} onChange={set('password')} />
            </>)}
            {mode === 'register' && (<>
              <input className="input" type="email" placeholder="Email" value={f.email} onChange={set('email')} autoFocus />
              <input className="input" placeholder="Username" value={f.username} onChange={set('username')} />
              <input className="input" type="password" placeholder="Password (min 6 characters)" value={f.password} onChange={set('password')} />
            </>)}
            {mode === 'verify' && (
              <input className="input text-center text-3xl tracking-[0.5em] font-display" inputMode="numeric" maxLength={6}
                placeholder="000000" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, '') })} autoFocus />
            )}
          </div>
          {info && <p className="text-amber-300 text-sm mt-3">{info}</p>}
          {err && <p className="text-rose-400 text-sm mt-3">{err}</p>}
          <button className="btn-amber w-full rounded-lg py-2.5 mt-5" disabled={busy}>
            {busy ? 'One moment...' : mode === 'login' ? 'Log in' : mode === 'register' ? 'Create account' : 'Verify and continue'}
          </button>
          <div className="text-sm text-slate-400 mt-5 flex justify-between">
            {mode === 'verify' ? (<>
              <button type="button" className="hover:text-white" onClick={resend}>Send a new code</button>
              <button type="button" className="hover:text-white" onClick={() => { setMode('login'); setInfo(''); setErr(''); }}>Back to login</button>
            </>) : (
              <button type="button" className="hover:text-white" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); setInfo(''); }}>
                {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
              </button>
            )}
          </div>
          {mode === 'login' && <p className="text-xs text-slate-500 mt-6">Demo logins: nova, orion, luna or atlas - password <b>password123</b></p>}
        </form>
      </div>
    </div>
  );
}
