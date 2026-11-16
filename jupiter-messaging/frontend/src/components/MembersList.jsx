import Avatar from './Avatar.jsx';
import { noteActive } from '../utils';

export default function MembersList({ ids, users, onProfile }) {
  const list = ids.map((id) => users[id]).filter(Boolean);
  const online = list.filter((u) => u.online), offline = list.filter((u) => !u.online);
  const Group = ({ title, items, dim }) => items.length > 0 && (
    <div className="mb-4">
      <p className="text-xs font-bold text-slate-400 px-2 mb-1">{title} - {items.length}</p>
      {items.map((u) => (
        <button key={u.id} onClick={() => onProfile(u.id)} className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-space-700 text-left ${dim ? 'opacity-50' : ''}`}>
          <Avatar user={u} size={32} status ring="border-space-800" />
          <span className="min-w-0">
            <span className="block text-sm font-medium truncate">{u.username}</span>
            {noteActive(u) && <span className="block text-[11px] text-violet-300 truncate">{u.noteText}</span>}
          </span>
        </button>
      ))}
    </div>
  );
  return (
    <aside className="hidden lg:block w-60 shrink-0 bg-space-900/70 border-l border-space-700 p-3 overflow-y-auto">
      <Group title="Online" items={online} />
      <Group title="Offline" items={offline} dim />
    </aside>
  );
}
