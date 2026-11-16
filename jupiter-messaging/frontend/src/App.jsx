import { useEffect, useRef, useState } from 'react';
import { Rocket } from 'lucide-react';
import api from './api';
import { connectSocket } from './socket';
import AuthScreen from './components/AuthScreen.jsx';
import NavRail from './components/NavRail.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChatArea from './components/ChatArea.jsx';
import MembersList from './components/MembersList.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import { ServerModal, DmModal, ChannelModal } from './components/Modals.jsx';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('jm_token'));
  const onAuth = (t) => { localStorage.setItem('jm_token', t); setToken(t); };
  const logout = () => { localStorage.removeItem('jm_token'); setToken(null); };
  return token ? <Main key={token} token={token} logout={logout} /> : <AuthScreen onAuth={onAuth} />;
}

function Main({ token, logout }) {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState({});
  const [servers, setServers] = useState([]);
  const [dms, setDms] = useState([]);
  const [serverId, setServerId] = useState(null);          // null = Home
  const [channelId, setChannelId] = useState(null);
  const [messages, setMessages] = useState({});
  const [typing, setTyping] = useState({});
  const [members, setMembers] = useState({});
  const [modal, setModal] = useState(null);                // 'server' | 'dm' | 'channel'
  const [profile, setProfile] = useState(null);            // { id, edit }
  const [showMembers, setShowMembers] = useState(true);
  const [connVer, setConnVer] = useState(0);
  const [, tick] = useState(0);
  const client = useRef(null);
  const subs = useRef({});
  const meRef = useRef(null);
  meRef.current = me;

  const upsertUser = (u) => {
    setUsers((p) => ({ ...p, [u.id]: { ...p[u.id], ...u } }));
    if (meRef.current?.id === u.id)
      setMe((m) => ({ ...m, online: u.online, noteText: u.noteText, noteExpiresAt: u.noteExpiresAt }));
  };
  const upsertChannel = (ch) => {
    if (ch.serverId) setServers((p) => p.map((s) => s.id === ch.serverId && !s.channels.some((c) => c.id === ch.id) ? { ...s, channels: [...s.channels, ch] } : s));
    else setDms((p) => (p.some((x) => x.id === ch.id) ? p : [ch, ...p]));
  };
  const onMsg = (m) => setMessages((p) => {
    const l = p[m.channelId];
    if (!l || l.some((x) => x.id === m.id)) return p;
    return { ...p, [m.channelId]: [...l, m] };
  });

  // initial load
  useEffect(() => {
    (async () => {
      try {
        const [m, u, s, d] = await Promise.all([api.get('/me'), api.get('/users'), api.get('/servers'), api.get('/dms')]);
        setMe(m.data); setUsers(Object.fromEntries(u.data.map((x) => [x.id, x])));
        setServers(s.data); setDms(d.data);
        if (d.data[0]) openChannel(d.data[0].id);
      } catch { logout(); }
    })();
  }, []);

  // websocket
  useEffect(() => {
    const c = connectSocket(token, (cl) => {
      subs.current = {};
      cl.subscribe('/topic/users', (f) => upsertUser(JSON.parse(f.body)));
      cl.subscribe('/user/queue/channels', (f) => upsertChannel(JSON.parse(f.body)));
      setConnVer((n) => n + 1);
    });
    client.current = c;
    const t = setInterval(() => tick((n) => n + 1), 1500);   // refreshes typing indicators / note expiry
    return () => { clearInterval(t); c.deactivate(); };
  }, [token]);

  // subscribe to every text channel + DM we know about
  useEffect(() => {
    const c = client.current;
    if (!c || !c.connected) return;
    const ids = [
      ...servers.flatMap((s) => s.channels.filter((ch) => ch.type === 'TEXT').map((ch) => ch.id)),
      ...dms.map((d) => d.id),
    ];
    ids.forEach((id) => {
      if (subs.current[id]) return;
      subs.current[id] = [
        c.subscribe('/topic/channel.' + id, (f) => onMsg(JSON.parse(f.body))),
        c.subscribe('/topic/channel.' + id + '.typing', (f) => {
          const t = JSON.parse(f.body);
          setTyping((p) => ({ ...p, [id]: { ...p[id], [t.userId]: Date.now() } }));
        }),
      ];
    });
  }, [connVer, servers, dms]);

  const openChannel = async (id) => {
    setChannelId(id);
    if (!messages[id]) {
      const r = await api.get(`/channels/${id}/messages`);
      setMessages((p) => ({ ...p, [id]: r.data }));
    }
  };
  const loadMembers = async (id) => {
    const r = await api.get(`/servers/${id}/members`);
    setMembers((p) => ({ ...p, [id]: r.data.map((u) => u.id) }));
  };
  const openServer = (s) => {
    setServerId(s.id); loadMembers(s.id);
    const first = s.channels.find((c) => c.type === 'TEXT');
    if (first) openChannel(first.id); else setChannelId(null);
  };
  const goHome = () => { setServerId(null); setChannelId(dms[0]?.id ?? null); if (dms[0]) openChannel(dms[0].id); };

  const send = (text) => client.current?.publish({ destination: '/app/chat.send', body: JSON.stringify({ channelId, content: text }) });
  const sendTyping = () => client.current?.publish({ destination: '/app/chat.typing', body: JSON.stringify({ channelId }) });

  const addServer = (s) => { setServers((p) => (p.some((x) => x.id === s.id) ? p : [...p, s])); openServer(s); setModal(null); };
  const addDm = (ch) => { upsertChannel(ch); setServerId(null); openChannel(ch.id); setModal(null); };
  const addChannel = (ch) => { upsertChannel(ch); openChannel(ch.id); setModal(null); };

  if (!me) return <div className="h-full flex items-center justify-center stars"><Rocket className="text-amber-400 animate-pulse" size={40} /></div>;

  const server = servers.find((s) => s.id === serverId);
  const channel = server ? server.channels.find((c) => c.id === channelId) : dms.find((d) => d.id === channelId);
  const memberIds = server ? members[server.id] || [] : (channel?.members || []).map((u) => u.id);
  const typers = Object.entries(typing[channelId] || {})
    .filter(([uid, t]) => Date.now() - t < 3000 && Number(uid) !== me.id)
    .map(([uid]) => users[uid]?.username).filter(Boolean);
  const self = { ...users[me.id], ...me };
  const allUsers = { ...users, [me.id]: self };

  return (
    <div className="h-full flex stars overflow-hidden">
      <NavRail servers={servers} serverId={serverId} onHome={goHome} onServer={openServer} onAdd={() => setModal('server')} />
      <Sidebar
        me={self} users={allUsers} server={server} servers={servers} dms={dms} channelId={channelId}
        onOpenChannel={openChannel} onNewDm={() => setModal('dm')} onNewChannel={() => setModal('channel')}
        onProfile={(id, edit) => setProfile({ id, edit })} onLogout={logout}
      />
      <main className="flex-1 flex min-w-0 bg-space-800/80 backdrop-blur-sm">
        <ChatArea
          me={self} users={allUsers} channel={channel} server={server} messages={messages[channelId]} typers={typers}
          onSend={send} onTyping={sendTyping} onProfile={(id) => setProfile({ id })}
          showMembers={showMembers} onToggleMembers={() => setShowMembers((v) => !v)}
        />
        {showMembers && channel && channel.type !== 'VOICE' && (
          <MembersList ids={memberIds} users={allUsers} onProfile={(id) => setProfile({ id })} />
        )}
      </main>
      {modal === 'server' && <ServerModal onClose={() => setModal(null)} onDone={addServer} />}
      {modal === 'dm' && <DmModal me={self} users={allUsers} onClose={() => setModal(null)} onDone={addDm} />}
      {modal === 'channel' && server && <ChannelModal server={server} onClose={() => setModal(null)} onDone={addChannel} />}
      {profile && (
        <ProfileModal
          key={profile.id + String(profile.edit)} user={allUsers[profile.id]} isSelf={profile.id === me.id} startEditing={!!profile.edit}
          onClose={() => setProfile(null)} onSaved={(u) => { setMe(u); setUsers((p) => ({ ...p, [u.id]: u })); }}
        />
      )}
    </div>
  );
}
