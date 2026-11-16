package com.jupiter.model;

import jakarta.persistence.*;
import lombok.*;

/** One table for server channels (TEXT/VOICE) and for DMs / group chats (server == null). */
@Entity @Table(name = "channels") @Getter @Setter @NoArgsConstructor
public class Channel {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 64) private String name;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ChannelType type;
    @ManyToOne private Server server;
}
