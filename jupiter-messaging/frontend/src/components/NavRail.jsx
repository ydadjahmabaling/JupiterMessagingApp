import { MessageCircle, Plus } from 'lucide-react';

const Pill = ({ active }) => (
  <span className={`absolute -left-3 top-1/2 -translate-y-1/2 w-1 rounded-r bg-amber-400 transition-all ${active ? 'h-9' : 'h-0'}`} />
);

export default function NavRail({ servers, serverId, onHome, onServer, onAdd }) {
  return (
    <nav className="w-[72px] shrink-0 bg-space-950/90 flex flex-col items-center py-3 gap-2 overflow-y-auto">
      <button title="Direct messages" onClick={onHome}
        className={`relative w-12 h-12 flex items-center justify-center transition-all ${serverId === null ? 'rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-space-950 shadow-glow' : 'rounded-3xl bg-space-700 text-amber-300 hover:rounded-2xl hover:bg-space-600'}`}>
        <Pill active={serverId === null} /><MessageCircle size={24} />
      </button>
      <div className="w-8 h-px bg-space-500 my-1" />
      {servers.map((s) => (
        <button key={s.id} title={s.name} onClick={() => onServer(s)}
          className={`relative w-12 h-12 overflow-hidden flex items-center justify-center font-display font-bold transition-all ${serverId === s.id ? 'rounded-2xl ring-2 ring-violet-400 shadow-violet' : 'rounded-3xl hover:rounded-2xl'} ${s.iconUrl ? '' : 'bg-space-600 text-violet-200'}`}>
          <Pill active={serverId === s.id} />
          {s.iconUrl ? <img src={s.iconUrl} alt="" className="w-full h-full object-cover" /> : s.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase()}
        </button>
      ))}
      <button title="Create or join a server" onClick={onAdd}
        className="w-12 h-12 rounded-3xl hover:rounded-2xl bg-space-700 text-emerald-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all">
        <Plus size={22} />
      </button>
    </nav>
  );
}
