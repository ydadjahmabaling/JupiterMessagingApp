import { useEffect, useRef, useState } from 'react';
import { Hash, Volume2, Send, Users, AtSign, Rocket } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { dmName } from './Sidebar.jsx';
import { fmtTime } from '../utils';

export default function ChatArea({ me, users, channel, server, messages, typers, onSend, onTyping, onProfile, showMembers, onToggleMembers }) {
  const [text, setText] = useState('');
  const end = useRef(null);
  const lastTyping = useRef(0);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages?.length, channel?.id]);

  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <Rocket size={44} className="text-amber-400 mb-4" />
        <h3 className="font-display font-bold text-xl">Pick a conversation</h3>
        <p className="text-slate-400 mt-1 text-sm">Choose a DM or channel on the left, or press + to start one.</p>
      </div>
    );
  }

  const title = server ? channel.name : dmName(channel, me, users);
  const voice = channel.type === 'VOICE';
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t); setText('');
  };
  const change = (e) => {
    setText(e.target.value);
    if (Date.now() - lastTyping.current > 2000) { lastTyping.current = Date.now(); onTyping(); }
  };

  // group consecutive messages from the same author (within 5 minutes)
  const rows = [];
  (messages || []).forEach((m, i, a) => {
    const prev = a[i - 1];
    const head = !prev || prev.author.id !== m.author.id || new Date(m.createdAt) - new Date(prev.createdAt) > 5 * 60000;
    rows.push({ m, head });
  });

  return (
    <section className="flex-1 flex flex-col min-w-0">
      <header className="h-14 shrink-0 px-4 flex items-center justify-between border-b border-space-700">
        <div className="flex items-center gap-2 min-w-0">
          {server ? (voice ? <Volume2 size={20} className="text-slate-400" /> : <Hash size={20} className="text-slate-400" />) : <AtSign size={20} className="text-slate-400" />}
          <h3 className="font-display font-bold truncate">{title}</h3>
        </div>
        <button onClick={onToggleMembers} title="Toggle member list" className={`p-2 rounded-lg hover:bg-space-700 ${showMembers ? 'text-amber-300' : 'text-slate-400'}`}><Users size={19} /></button>
      </header>

      {voice ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
          <Volume2 size={40} className="mb-3 text-violet-400" />
          <p className="font-bold text-slate-200">Voice channels are listed for layout only</p>
          <p className="text-sm mt-1">Real-time audio (WebRTC) is not part of this build.</p>
        </div>
      ) : (<>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages === undefined && <p className="text-slate-500 text-sm">Loading messages...</p>}
          {messages?.length === 0 && <p className="text-slate-400 text-sm">This is the start of {server ? '#' + title : 'your conversation'}. Say hello.</p>}
          {rows.map(({ m, head }) => (
            <div key={m.id} className={`flex gap-3 hover:bg-space-700/40 rounded-lg px-2 ${head ? 'mt-4 pt-1' : ''}`}>
              {head ? (
                <button onClick={() => onProfile(m.author.id)}><Avatar user={users[m.author.id] || m.author} size={40} /></button>
              ) : <span className="w-10 shrink-0" />}
              <div className="min-w-0">
                {head && (
                  <div className="flex items-baseline gap-2">
                    <button onClick={() => onProfile(m.author.id)} className="font-bold text-amber-200 hover:underline">{m.author.username}</button>
                    <span className="text-[11px] text-slate-500">{fmtTime(m.createdAt)}</span>
                  </div>
                )}
                <p className="text-slate-200 whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          ))}
          <div ref={end} />
        </div>
        <div className="px-4 pb-4 shrink-0">
          <div className="h-5 text-xs text-violet-300 px-1">
            {typers.length > 0 && `${typers.join(', ')} ${typers.length > 1 ? 'are' : 'is'} typing...`}
          </div>
          <div className="flex items-end gap-2 bg-space-700 rounded-xl px-3 py-2 border border-space-500 focus-within:border-violet-400">
            <textarea rows={1} value={text} onChange={change} maxLength={2000} placeholder={`Message ${server ? '#' + title : '@' + title}`}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              className="flex-1 bg-transparent outline-none resize-none max-h-40 py-1 placeholder:text-slate-500" />
            <button onClick={submit} disabled={!text.trim()} title="Send" className="p-2 rounded-lg btn-amber"><Send size={17} /></button>
          </div>
        </div>
      </>)}
    </section>
  );
}
