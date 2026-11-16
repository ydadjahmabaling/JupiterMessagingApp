import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import api, { errMsg } from '../api';
import Avatar from './Avatar.jsx';
import { resizeImage } from '../utils';

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className={`bg-space-800 border border-space-500 rounded-2xl shadow-violet w-full ${wide ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 pt-5">
          <h3 className="font-display font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function ServerModal({ onClose, onDone }) {
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const go = async () => {
    setErr('');
    try {
      const r = tab === 'create' ? await api.post('/servers', { name, iconUrl: icon || null }) : await api.post('/servers/join', { code });
      onDone(r.data);
    } catch (e) { setErr(errMsg(e)); }
  };
  const pick = async (e) => { const f = e.target.files[0]; if (f) setIcon(await resizeImage(f, 128, 128)); };
  return (
    <Modal title="Add a server" onClose={onClose}>
      <div className="flex gap-2 mb-5">
        {['create', 'join'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${tab === t ? 'bg-violet-500/25 text-violet-100' : 'bg-space-700 text-slate-400'}`}>
            {t === 'create' ? 'Create' : 'Join with a code'}
          </button>
        ))}
      </div>
      {tab === 'create' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="w-16 h-16 rounded-2xl bg-space-700 border border-dashed border-space-500 flex items-center justify-center cursor-pointer overflow-hidden text-slate-400 hover:text-white">
              {icon ? <img src={icon} alt="" className="w-full h-full object-cover" /> : <Upload size={20} />}
              <input type="file" accept="image/*" hidden onChange={pick} />
            </label>
            <input className="input" placeholder="Server name" value={name} onChange={(e) => setName(e.target.value)} maxLength={64} autoFocus />
          </div>
          <p className="text-xs text-slate-500">You get a #general text channel and an invite code to share.</p>
        </div>
      ) : (
        <input className="input uppercase tracking-widest" placeholder="Invite code, e.g. JUPITER1" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
      )}
      {err && <p className="text-rose-400 text-sm mt-3">{err}</p>}
      <button onClick={go} className="btn-amber w-full rounded-lg py-2.5 mt-5">{tab === 'create' ? 'Create server' : 'Join server'}</button>
    </Modal>
  );
}

export function DmModal({ me, users, onClose, onDone }) {
  const [sel, setSel] = useState([]);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const go = async () => {
    try { onDone((await api.post('/dms', { userIds: sel, name: sel.length > 1 ? name : null })).data); }
    catch (e) { setErr(errMsg(e)); }
  };
  return (
    <Modal title="Start a conversation" onClose={onClose}>
      <p className="text-sm text-slate-400 mb-3">Pick one person for a DM, or several for a group chat.</p>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {Object.values(users).filter((u) => u.id !== me.id).map((u) => (
          <label key={u.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-space-700 cursor-pointer">
            <Avatar user={u} size={32} status ring="border-space-800" />
            <span className="flex-1 text-sm font-medium">{u.username}</span>
            <input type="checkbox" checked={sel.includes(u.id)} onChange={() => toggle(u.id)} className="accent-amber-400 w-4 h-4" />
          </label>
        ))}
      </div>
      {sel.length > 1 && <input className="input mt-3" placeholder="Group name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={64} />}
      {err && <p className="text-rose-400 text-sm mt-3">{err}</p>}
      <button disabled={!sel.length} onClick={go} className="btn-amber w-full rounded-lg py-2.5 mt-4">
        {sel.length > 1 ? 'Create group chat' : 'Open DM'}
      </button>
    </Modal>
  );
}

export function ChannelModal({ server, onClose, onDone }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('TEXT');
  const [err, setErr] = useState('');
  const go = async () => {
    try { onDone((await api.post(`/servers/${server.id}/channels`, { name, type })).data); }
    catch (e) { setErr(errMsg(e)); }
  };
  return (
    <Modal title={`New channel in ${server.name}`} onClose={onClose}>
      <div className="flex gap-2 mb-4">
        {[['TEXT', 'Text'], ['VOICE', 'Voice']].map(([v, l]) => (
          <button key={v} onClick={() => setType(v)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${type === v ? 'bg-violet-500/25 text-violet-100' : 'bg-space-700 text-slate-400'}`}>{l}</button>
        ))}
      </div>
      <input className="input" placeholder="channel-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus />
      {err && <p className="text-rose-400 text-sm mt-3">{err}</p>}
      <button onClick={go} className="btn-amber w-full rounded-lg py-2.5 mt-4">Create channel</button>
    </Modal>
  );
}
