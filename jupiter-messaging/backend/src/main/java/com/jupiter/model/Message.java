package com.jupiter.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "messages", indexes = @Index(columnList = "channel_id,id"))
@Getter @Setter @NoArgsConstructor
public class Message {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) private Channel channel;
    @ManyToOne(optional = false) private User author;
    @Column(nullable = false, length = 2000) private String content;
    @Column(nullable = false) private Instant createdAt;
}
