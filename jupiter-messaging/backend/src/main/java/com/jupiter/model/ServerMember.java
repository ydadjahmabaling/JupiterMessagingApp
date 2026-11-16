package com.jupiter.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "server_members", uniqueConstraints = @UniqueConstraint(columnNames = {"server_id", "user_id"}))
@Getter @Setter @NoArgsConstructor
public class ServerMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) private Server server;
    @ManyToOne(optional = false) private User user;
    public ServerMember(Server s, User u) { this.server = s; this.user = u; }
}
