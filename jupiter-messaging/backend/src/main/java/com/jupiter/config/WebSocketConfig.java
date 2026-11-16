package com.jupiter.config;

import com.jupiter.security.JwtService;
import com.jupiter.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.*;
import java.util.List;

@Configuration @EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Autowired private JwtService jwt;
    @Autowired @Lazy private ChatService chat;   // lazy: ChatService needs SimpMessagingTemplate from this config

    @Override
    public void registerStompEndpoints(StompEndpointRegistry r) {
        r.addEndpoint("/ws").setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry r) {
        r.enableSimpleBroker("/topic", "/queue");
        r.setApplicationDestinationPrefixes("/app");
        r.setUserDestinationPrefix("/user");
    }

    /** JWT-authenticate the STOMP CONNECT frame and guard channel subscriptions. */
    @Override
    public void configureClientInboundChannel(ChannelRegistration reg) {
        reg.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> msg, MessageChannel ch) {
                StompHeaderAccessor a = MessageHeaderAccessor.getAccessor(msg, StompHeaderAccessor.class);
                if (a == null || a.getCommand() == null) return msg;
                if (StompCommand.CONNECT.equals(a.getCommand())) {
                    String h = a.getFirstNativeHeader("Authorization");
                    Long id = (h != null && h.startsWith("Bearer ")) ? jwt.parse(h.substring(7)) : null;
                    if (id == null) throw new MessageDeliveryException("Unauthorized");
                    a.setUser(new UsernamePasswordAuthenticationToken(id.toString(), null, List.of()));
                } else if (StompCommand.SUBSCRIBE.equals(a.getCommand())) {
                    String d = a.getDestination();
                    if (d != null && d.startsWith("/topic/channel.")) {
                        Long cid = Long.valueOf(d.substring("/topic/channel.".length()).replace(".typing", ""));
                        if (a.getUser() == null || !chat.canAccess(Long.valueOf(a.getUser().getName()), cid))
                            throw new MessageDeliveryException("Forbidden");
                    }
                }
                return msg;
            }
        });
    }
}
