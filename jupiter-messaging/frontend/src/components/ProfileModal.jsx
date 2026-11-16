import { useState } from 'react';
import { X, Pencil, MapPin, Upload, Trash2 } from 'lucide-react';
import api, { errMsg } from '../api';
import Avatar from './Avatar.jsx';
import Globe from './Globe.jsx';
import { CITIES, colorFor, noteActive, resizeImage } from '../utils';

function ImageField({ label, value, onChange, w, h }) {
  const pick = async (e) => {
    const f = e.target.files[0];
    if (f) try { onChange(await resizeImage(f, w, h)); } catch { /* ignore */ }
  };
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
      <div className="flex gap-2">
        <input className="input" placeholder="Paste an image URL" value={value?.startsWith('data:') ? '' : value || ''} onChange={(e) => onChange(e.target.value)} />
        <label className="shrink-0 px-3 rounded-lg bg-space-700 border border-space-500 flex items-center gap-2 text-sm cursor-pointer hover:bg-space-600">
          <Upload size={15} /> Upload<input type="file" accept="image/*" hidden onChange={pick} />
        </label>
        {value && <button type="button" onClick={() => onChange('')} title="Remove" className="px-2 text-slate-400 hover:text-rose-400"><Trash2 size={16} /></button>}
      </div>
      {value?.startsWith('data:') && <p className="text-[11px] text-emerald-400 mt-1">Uploaded image ready to save</p>}
    </div>
  );
}

export default function ProfileModal({ user, isSelf, startEditing, onClose, onSaved }) {
  const [edit, setEdit] = useState(startEditing && isSelf);
  const [f, setF] = useState({
    avatarUrl: user.avatarUrl || '', bannerUrl: user.bannerUrl || '', bio: user.bio || '',
    shareLocation: !!user.shareLocation, city: user.city || '', country: user.country || '', lat: user.lat ?? null, lng: user.lng ?? null,
  });
  const [note, setNote] = useState(user.noteText || '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const shown = edit ? f : user;                       // live preview while editing
  const preview = { ...user, avatarUrl: shown.avatarUrl, bannerUrl: shown.bannerUrl };
  const pinned = shown.shareLocation && shown.lat != null;
  const has = noteActive(user);

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api.put('/me/profile', f);
      onSaved(r.data); setEdit(false);
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const postNote = async (clear) => {
    try { const r = clear ? await api.delete('/me/note') : await api.put('/me/note', { text: note }); onSaved(r.data); if (clear) setNote(''); }
    catch (e) { setErr(errMsg(e)); }
  };
  const pickCity = (e) => {
    const c = CITIES.find((x) => x.city === e.target.value);
    setF(c ? { ...f, city: c.city, country: c.country, lat: c.lat, lng: c.lng } : { ...f, city: '', country: '', lat: null, lng: null });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className="bg-space-800 border border-space-500 rounded-2xl shadow-violet w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className={`relative h-28 bg-gradient-to-br ${colorFor(user.id)}`}>
          {preview.bannerUrl && <img src={preview.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"><X size={18} /></button>
          {isSelf && !edit && (
            <button onClick={() => setEdit(true)} className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"><Pencil size={13} /> Edit profile</button>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10">
            <Avatar user={preview} size={84} status={!edit} ring="border-space-800" className="rounded-full ring-4 ring-space-800" />
            {has && !edit && <span className="mb-1 max-w-[190px] px-3 py-1.5 rounded-2xl bg-violet-500/25 border border-violet-400/40 text-violet-100 text-sm break-words">{user.noteText}</span>}
          </div>
          <h2 className="font-display font-extrabold text-2xl mt-3">{user.username}</h2>

          {!edit ? (<>
            {user.bio ? <p className="text-slate-300 mt-2 whitespace-pre-wrap break-words">{user.bio}</p> : <p className="text-slate-500 mt-2 text-sm">No bio yet.</p>}
          </>) : (
            <div className="space-y-4 mt-4">
              <ImageField label="Avatar" value={f.avatarUrl} onChange={(v) => setF({ ...f, avatarUrl: v })} w={256} h={256} />
              <ImageField label="Banner" value={f.bannerUrl} onChange={(v) => setF({ ...f, bannerUrl: v })} w={960} h={320} />
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1">Bio <span className="font-normal text-slate-500">({f.bio.length}/500)</span></p>
                <textarea className="input resize-none" rows={3} maxLength={500} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1">Status note <span className="font-normal text-slate-500">(disappears after 24 hours)</span></p>
                <div className="flex gap-2">
                  <input className="input" maxLength={60} placeholder="Listening to lo-fi 🚀" value={note} onChange={(e) => setNote(e.target.value)} />
                  <button type="button" onClick={() => postNote(false)} disabled={!note.trim()} className="btn-amber px-3 rounded-lg text-sm">Post</button>
                  {has && <button type="button" onClick={() => postNote(true)} className="px-2 text-slate-400 hover:text-rose-400" title="Remove note"><Trash2 size={16} /></button>}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{note.length}/60</p>
              </div>
              <label className="flex items-center justify-between gap-3 bg-space-700 rounded-lg px-3 py-2.5 cursor-pointer">
                <span className="text-sm font-medium flex items-center gap-2"><MapPin size={16} className="text-amber-400" /> Share location on globe</span>
                <input type="checkbox" className="accent-amber-400 w-4 h-4" checked={f.shareLocation} onChange={(e) => setF({ ...f, shareLocation: e.target.checked })} />
              </label>
              {f.shareLocation && (
                <select className="input" value={f.city} onChange={pickCity}>
                  <option value="">Choose your city...</option>
                  {CITIES.map((c) => <option key={c.city} value={c.city}>{c.city}, {c.country}</option>)}
                </select>
              )}
            </div>
          )}

          <div className="mt-5 rounded-xl bg-space-950/70 border border-space-600 py-4 flex flex-col items-center">
            <Globe lat={pinned ? shown.lat : null} lng={pinned ? shown.lng : null} size={240} />
            <p className="text-sm mt-1 flex items-center gap-1.5 text-slate-300">
              <MapPin size={14} className={pinned ? 'text-amber-400' : 'text-slate-500'} />
              {pinned ? `${shown.city}, ${shown.country}` : 'Location hidden'}
            </p>
          </div>

          {err && <p className="text-rose-400 text-sm mt-3">{err}</p>}
          {edit && (
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEdit(false)} className="px-4 rounded-lg bg-space-700 hover:bg-space-600 text-sm font-bold">Cancel</button>
              <button onClick={save} disabled={busy || (f.shareLocation && f.lat == null)} className="btn-amber flex-1 rounded-lg py-2.5">{busy ? 'Saving...' : 'Save changes'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
