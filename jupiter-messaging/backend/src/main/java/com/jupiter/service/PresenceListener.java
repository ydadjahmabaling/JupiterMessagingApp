package com.jupiter.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Tracks WebSocket sessions -> live online/offline presence; also expires 24h notes. */
@Component @RequiredArgsConstructor
public class PresenceListener {
    private final ChatService chat;
    private final Map<String, Long> sessions = new ConcurrentHashMap<>();

    @EventListener
    public void onConnect(SessionConnectedEvent e) {
        if (e.getUser() == null) return;
        Long id = Long.valueOf(e.getUser().getName());
        sessions.put(SimpMessageHeaderAccessor.getSessionId(e.getMessage().getHeaders()), id);
        chat.setOnline(id, true);
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent e) {
        Long id = sessions.remove(e.getSessionId());
        if (id != null && !sessions.containsValue(id)) chat.setOnline(id, false);
    }

    @Scheduled(fixedRate = 60_000)
    public void expireNotes() { chat.expireNotes(); }
}
