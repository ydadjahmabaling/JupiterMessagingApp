package com.jupiter.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "servers") @Getter @Setter @NoArgsConstructor
public class Server {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 64) private String name;
    @Column(columnDefinition = "MEDIUMTEXT") private String iconUrl;
    @Column(unique = true, nullable = false, length = 16) private String inviteCode;
    @ManyToOne(optional = false) private User owner;
}
