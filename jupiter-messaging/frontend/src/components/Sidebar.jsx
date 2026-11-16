import { useState } from 'react';
import { Hash, Volume2, Plus, Settings, LogOut, Users, Copy, Check, Pencil } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { noteActive } from '../utils';

export const dmName = (ch, me, users) => {
  if (ch.type === 'GROUP') return ch.name;
  const other = ch.members.find((m) => m.id !== me.id);
  return other ? users[other.id]?.username || other.username : 'Unknown';
};

function NoteStrip({ me, users, onProfile }) {
  const others = Object.values(users).filter((u) => u.id !== me.id && noteActive(u));
  return (
    <div className="px-3 pt-3 pb-2">
      <p className="text-xs font-bold text-slate-400 mb-2 px-1">Notes</p>
      <div className="flex gap-3 overflow-x-auto pb-1 pt-7">
        {[me, ...others].map((u) => {
          const mine = u.id === me.id, has = noteActive(u);
          return (
            <button key={u.id} onClick={() => onProfile(u.id, mine && !has)} className="relative shrink-0 w-14 text-center group">
              <span className={`absolute -top-6 left-1/2 -translate-x-1/2 max-w-[104px] truncate whitespace-nowrap px-2 py-1 rounded-xl text-[11px] leading-none z-10 ${has ? 'bg-violet-500/30 text-violet-100 border border-violet-400/40' : 'bg-space-600 text-slate-400 border border-space-500'}`}>
                {has ? u.noteText : mine ? 'Add note' : ''}
              </span>
              <Avatar user={u} size={44} status className="mx-auto" ring="border-space-900" />
              <span className="block text-[11px] mt-1 truncate text-slate-400 group-hover:text-white">{mine ? 'You' : u.username}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar({ me, users, server, dms, channelId, onOpenChannel, onNewDm, onNewChannel, onProfile, onLogout }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(server.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const text = server?.channels.filter((c) => c.type === 'TEXT') || [];
  const voice = server?.channels.filter((c) => c.type === 'VOICE') || [];
  const isOwner = server && server.ownerId === me.id;

  return (
    <aside className="w-64 shrink-0 bg-space-900/90 flex flex-col border-r border-space-700">
      <header className="h-14 px-4 flex items-center justify-between border-b border-space-700 shrink-0">
        <h2 className="font-display font-bold truncate">{server ? server.name : 'Home'}</h2>
        {server && (
          <button onClick={copy} title="Copy invite code" className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 bg-space-700 rounded-md px-2 py-1">
            {copied ? <Check size={13} /> : <Copy size={13} />} {server.inviteCode}
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {!server ? (<>
          <NoteStrip me={me} users={users} onProfile={onProfile} />
          <div className="px-3 mt-1 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 px-1">Direct messages</p>
            <button onClick={onNewDm} title="New DM or group chat" className="text-slate-400 hover:text-white"><Plus size={16} /></button>
          </div>
          <ul className="px-2 mt-2 space-y-0.5">
            {dms.map((d) => {
              const other = d.type === 'DM' ? d.members.find((m) => m.id !== me.id) : null;
              return (
                <li key={d.id}>
                  <button onClick={() => onOpenChannel(d.id)}
                    className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left ${channelId === d.id ? 'bg-violet-500/20 text-white' : 'text-slate-400 hover:bg-space-700 hover:text-slate-200'}`}>
                    {other ? <Avatar user={users[other.id] || other} size={32} status />
                      : <span className="w-8 h-8 rounded-full bg-space-600 flex items-center justify-center text-violet-300"><Users size={16} /></span>}
                    <span className="truncate text-sm font-medium">{dmName(d, me, users)}</span>
                  </button>
                </li>
              );
            })}
            {dms.length === 0 && <li className="text-xs text-slate-500 px-2 py-3">No conversations yet. Press + to start one.</li>}
          </ul>
        </>) : (<div className="px-2 py-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-xs font-bold text-slate-400">Text channels</p>
            {isOwner && <button onClick={onNewChannel} title="Add channel" className="text-slate-400 hover:text-white"><Plus size={16} /></button>}
          </div>
          {text.map((c) => (
            <button key={c.id} onClick={() => onOpenChannel(c.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${channelId === c.id ? 'bg-violet-500/20 text-white' : 'text-slate-400 hover:bg-space-700 hover:text-slate-200'}`}>
              <Hash size={17} className="shrink-0" /><span className="truncate">{c.name}</span>
            </button>
          ))}
          <p className="text-xs font-bold text-slate-400 px-2 mt-5 mb-1">Voice channels</p>
          {voice.map((c) => (
            <button key={c.id} title="Voice is not implemented yet" onClick={() => onOpenChannel(c.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${channelId === c.id ? 'bg-violet-500/20 text-white' : 'text-slate-400 hover:bg-space-700 hover:text-slate-200'}`}>
              <Volume2 size={17} className="shrink-0" /><span className="truncate">{c.name}</span>
            </button>
          ))}
        </div>)}
      </div>

      <footer className="h-16 shrink-0 bg-space-950/70 px-3 flex items-center gap-2">
        <button onClick={() => onProfile(me.id)} className="flex items-center gap-2 min-w-0 flex-1 text-left hover:bg-space-700 rounded-lg p-1">
          <Avatar user={me} size={36} status ring="border-space-950" />
          <span className="min-w-0">
            <span className="block text-sm font-bold truncate">{me.username}</span>
            <span className="block text-xs text-emerald-400">Online</span>
          </span>
        </button>
        <button title="Edit profile" onClick={() => onProfile(me.id, true)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-space-700"><Settings size={18} /></button>
        <button title="Log out" onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-space-700"><LogOut size={18} /></button>
      </footer>
    </aside>
  );
}
