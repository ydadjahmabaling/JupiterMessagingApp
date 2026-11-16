package com.jupiter.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "channel_members", uniqueConstraints = @UniqueConstraint(columnNames = {"channel_id", "user_id"}))
@Getter @Setter @NoArgsConstructor
public class ChannelMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) private Channel channel;
    @ManyToOne(optional = false) private User user;
    public ChannelMember(Channel c, User u) { this.channel = c; this.user = u; }
}
