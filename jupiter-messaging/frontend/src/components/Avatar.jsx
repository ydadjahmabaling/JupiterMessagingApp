import { colorFor } from '../utils';

export default function Avatar({ user, size = 40, status = false, ring = 'border-space-900', className = '' }) {
  return (
    <div className={'relative shrink-0 ' + className} style={{ width: size, height: size }}>
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
      ) : (
        <div style={{ fontSize: size * 0.42 }}
          className={`w-full h-full rounded-full flex items-center justify-center font-display font-bold text-white bg-gradient-to-br ${colorFor(user?.id)}`}>
          {(user?.username || '?')[0].toUpperCase()}
        </div>
      )}
      {status && (
        <span className={`absolute -bottom-0.5 -right-0.5 rounded-full border-[3px] ${ring} ${user?.online ? 'bg-emerald-400' : 'bg-slate-500'}`}
          style={{ width: Math.max(12, size * 0.34), height: Math.max(12, size * 0.34) }} />
      )}
    </div>
  );
}
