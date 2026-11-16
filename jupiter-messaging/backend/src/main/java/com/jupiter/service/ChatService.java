package com.jupiter.service;

import com.jupiter.dto.Dtos.*;
import com.jupiter.model.*;
import com.jupiter.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class ChatService {
    private final UserRepository users;
    private final ServerRepository servers;
    private final ServerMemberRepository sMembers;
    private final ChannelRepository channels;
    private final ChannelMemberRepository cMembers;
    private final MessageRepository messages;
    private final SimpMessagingTemplate ws;
    private static final SecureRandom RND = new SecureRandom();

    public static ResponseStatusException bad(String m) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, m); }
    private static ResponseStatusException forbidden(String m) { return new ResponseStatusException(HttpStatus.FORBIDDEN, m); }
    private static ResponseStatusException notFound(String m) { return new ResponseStatusException(HttpStatus.NOT_FOUND, m); }
    private static String blank(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }

    // ---------- mapping ----------
    /** self=true exposes stored location even when sharing is switched off (so the owner can edit it). */
    public UserDto dto(User u, boolean self) {
        boolean note = u.getNoteText() != null && u.getNoteExpiresAt() != null && u.getNoteExpiresAt().isAfter(Instant.now());
        boolean loc = u.isShareLocation() || self;
        return new UserDto(u.getId(), u.getUsername(), u.getAvatarUrl(), u.getBannerUrl(), u.getBio(), u.isOnline(),
                note ? u.getNoteText() : null, note ? u.getNoteExpiresAt().toString() : null, u.isShareLocation(),
                loc ? u.getCity() : null, loc ? u.getCountry() : null, loc ? u.getLat() : null, loc ? u.getLng() : null);
    }
    public ChannelDto channelDto(Channel c) {
        List<UserDto> mem = c.getServer() == null
                ? cMembers.findByChannelId(c.getId()).stream().map(m -> dto(m.getUser(), false)).toList() : List.of();
        return new ChannelDto(c.getId(), c.getName(), c.getType().name(), c.getServer() == null ? null : c.getServer().getId(), mem);
    }
    public ServerDto serverDto(Server s) {
        return new ServerDto(s.getId(), s.getName(), s.getIconUrl(), s.getInviteCode(), s.getOwner().getId(),
                channels.findByServerIdOrderById(s.getId()).stream().map(this::channelDto).toList());
    }
    private MessageDto msgDto(Message m) {
        return new MessageDto(m.getId(), m.getChannel().getId(), dto(m.getAuthor(), false), m.getContent(), m.getCreatedAt().toString());
    }
    private User user(Long id) { return users.findById(id).orElseThrow(() -> notFound("User not found")); }

    // ---------- users, profile, notes ----------
    public UserDto me(Long id) { return dto(user(id), true); }
    public List<UserDto> allUsers() { return users.findAll().stream().filter(User::isVerified).map(u -> dto(u, false)).toList(); }

    public void broadcastUser(User u) { ws.convertAndSend("/topic/users", dto(u, false)); }

    public void setOnline(Long id, boolean online) {
        users.findById(id).ifPresent(u -> { u.setOnline(online); users.save(u); broadcastUser(u); });
    }

    public UserDto updateProfile(Long id, ProfileReq r) {
        User u = user(id);
        if (r.bio() != null && r.bio().length() > 500) throw bad("Bio is limited to 500 characters");
        u.setAvatarUrl(blank(r.avatarUrl()));
        u.setBannerUrl(blank(r.bannerUrl()));
        u.setBio(blank(r.bio()));
        u.setShareLocation(r.shareLocation() && r.lat() != null && r.lng() != null);
        if (r.lat() != null && r.lng() != null) {           // remember the picked city even while sharing is off
            u.setCity(r.city()); u.setCountry(r.country()); u.setLat(r.lat()); u.setLng(r.lng());
        }
        users.save(u); broadcastUser(u);
        return dto(u, true);
    }

    public UserDto setNote(Long id, String text) {
        User u = user(id);
        text = blank(text);
        if (text != null && text.length() > 60) throw bad("Notes are limited to 60 characters");
        u.setNoteText(text);
        u.setNoteExpiresAt(text == null ? null : Instant.now().plus(24, ChronoUnit.HOURS));
        users.save(u); broadcastUser(u);
        return dto(u, true);
    }

    /** Called by the scheduler: clears notes older than 24h and tells everyone. */
    public void expireNotes() {
        users.findByNoteTextNotNullAndNoteExpiresAtBefore(Instant.now()).forEach(u -> {
            u.setNoteText(null); u.setNoteExpiresAt(null); users.save(u); broadcastUser(u);
        });
    }

    // ---------- access ----------
    public boolean canAccess(Long userId, Long channelId) {
        Channel c = channels.findById(channelId).orElse(null);
        if (c == null) return false;
        return c.getServer() != null ? sMembers.existsByServerIdAndUserId(c.getServer().getId(), userId)
                                     : cMembers.existsByChannelIdAndUserId(channelId, userId);
    }

    // ---------- servers & channels ----------
    public Channel mkChannel(Server s, String name, ChannelType t) {
        Channel c = new Channel(); c.setServer(s); c.setName(name); c.setType(t); return channels.save(c);
    }

    public ServerDto createServer(Long uid, ServerReq r) {
        String name = blank(r.name());
        if (name == null) throw bad("Server name is required");
        Server s = new Server();
        s.setName(name.length() > 64 ? name.substring(0, 64) : name);
        s.setIconUrl(blank(r.iconUrl()));
        s.setOwner(user(uid));
        s.setInviteCode(newInviteCode());
        servers.save(s);
        sMembers.save(new ServerMember(s, s.getOwner()));
        mkChannel(s, "general", ChannelType.TEXT);
        mkChannel(s, "Lounge", ChannelType.VOICE);
        return serverDto(s);
    }

    public String newInviteCode() {
        String abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; StringBuilder b = new StringBuilder();
        for (int i = 0; i < 8; i++) b.append(abc.charAt(RND.nextInt(abc.length())));
        return b.toString();
    }

    public ServerDto joinServer(Long uid, String code) {
        Server s = servers.findByInviteCode(code == null ? "" : code.trim().toUpperCase())
                .orElseThrow(() -> notFound("That invite code doesn't match any server"));
        if (!sMembers.existsByServerIdAndUserId(s.getId(), uid)) sMembers.save(new ServerMember(s, user(uid)));
        return serverDto(s);
    }

    public List<ServerDto> myServers(Long uid) {
        return sMembers.findByUserId(uid).stream().map(m -> serverDto(m.getServer())).toList();
    }

    public List<UserDto> serverMembers(Long uid, Long sid) {
        if (!sMembers.existsByServerIdAndUserId(sid, uid)) throw forbidden("You are not in this server");
        return sMembers.findByServerId(sid).stream().map(m -> dto(m.getUser(), false)).toList();
    }

    public ChannelDto addChannel(Long uid, Long sid, ChannelReq r) {
        Server s = servers.findById(sid).orElseThrow(() -> notFound("Server not found"));
        if (!s.getOwner().getId().equals(uid)) throw forbidden("Only the server owner can add channels");
        String n = r.name() == null ? "" : r.name().trim().toLowerCase().replaceAll("[^a-z0-9_ -]", "").replaceAll("\\s+", "-");
        if (n.isEmpty()) throw bad("Channel name is required");
        Channel c = mkChannel(s, n, "VOICE".equalsIgnoreCase(r.type()) ? ChannelType.VOICE : ChannelType.TEXT);
        ChannelDto d = channelDto(c);
        sMembers.findByServerId(sid).forEach(m -> ws.convertAndSendToUser(m.getUser().getId().toString(), "/queue/channels", d));
        return d;
    }

    // ---------- DMs & group chats ----------
    public List<ChannelDto> myDms(Long uid) {
        return cMembers.findByUserId(uid).stream().map(ChannelMember::getChannel)
                .sorted(Comparator.comparing(Channel::getId).reversed()).map(this::channelDto).toList();
    }

    public ChannelDto createDm(Long uid, DmReq r) {
        Set<Long> ids = new LinkedHashSet<>(); ids.add(uid);
        if (r.userIds() != null) ids.addAll(r.userIds());
        if (ids.size() < 2) throw bad("Pick at least one person");
        List<User> ms = ids.stream().map(this::user).toList();
        boolean group = ids.size() > 2;
        if (!group) {
            Long other = ids.stream().filter(i -> !i.equals(uid)).findFirst().orElseThrow();
            for (ChannelMember cm : cMembers.findByUserId(uid)) {
                Channel c = cm.getChannel();
                if (c.getType() == ChannelType.DM && cMembers.existsByChannelIdAndUserId(c.getId(), other)) return channelDto(c);
            }
        }
        String name = blank(r.name());
        if (name == null) name = group ? ms.stream().map(User::getUsername).collect(Collectors.joining(", ")) : "dm";
        Channel c = new Channel();
        c.setType(group ? ChannelType.GROUP : ChannelType.DM);
        c.setName(name.length() > 64 ? name.substring(0, 64) : name);
        channels.save(c);
        ms.forEach(u -> cMembers.save(new ChannelMember(c, u)));
        ChannelDto d = channelDto(c);
        ids.forEach(i -> ws.convertAndSendToUser(i.toString(), "/queue/channels", d));
        return d;
    }

    // ---------- messages ----------
    public List<MessageDto> history(Long uid, Long cid) {
        if (!canAccess(uid, cid)) throw forbidden("No access to this channel");
        List<Message> l = new ArrayList<>(messages.findTop100ByChannelIdOrderByIdDesc(cid));
        Collections.reverse(l);
        return l.stream().map(this::msgDto).toList();
    }

    public void send(Long uid, Long cid, String content) {
        if (content == null || content.isBlank() || cid == null) return;
        content = content.trim();
        if (content.length() > 2000) throw bad("Message is too long (max 2000 characters)");
        if (!canAccess(uid, cid)) throw forbidden("No access to this channel");
        Message m = new Message();
        m.setChannel(channels.findById(cid).orElseThrow());
        m.setAuthor(user(uid));
        m.setContent(content);
        m.setCreatedAt(Instant.now());
        messages.save(m);
        ws.convertAndSend("/topic/channel." + cid, msgDto(m));
    }

    public void typing(Long uid, Long cid) {
        if (cid != null && canAccess(uid, cid)) ws.convertAndSend("/topic/channel." + cid + ".typing", Map.of("userId", uid));
    }
}
