package com.jupiter.web;

import com.jupiter.dto.Dtos.*;
import com.jupiter.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import java.security.Principal;

/** STOMP endpoints: client sends to /app/chat.send and /app/chat.typing; the server fans out on /topic/channel.{id}. */
@Controller @RequiredArgsConstructor
public class ChatSocketController {
    private final ChatService chat;

    @MessageMapping("/chat.send")
    public void send(SendMsg m, Principal p) { chat.send(Long.valueOf(p.getName()), m.channelId(), m.content()); }

    @MessageMapping("/chat.typing")
    public void typing(TypingMsg m, Principal p) { chat.typing(Long.valueOf(p.getName()), m.channelId()); }
}
