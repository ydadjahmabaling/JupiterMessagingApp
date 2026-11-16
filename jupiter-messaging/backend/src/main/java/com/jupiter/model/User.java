package com.jupiter.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "users") @Getter @Setter @NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(unique = true, nullable = false) private String email;
    @Column(unique = true, nullable = false, length = 32) private String username;
    @Column(nullable = false) private String passwordHash;
    @Column(columnDefinition = "MEDIUMTEXT") private String avatarUrl;
    @Column(columnDefinition = "MEDIUMTEXT") private String bannerUrl;
    @Column(length = 500) private String bio;
    private boolean verified;
    private boolean online;
    @Column(length = 60) private String noteText;
    private Instant noteExpiresAt;
    private boolean shareLocation;
    private String city;
    private String country;
    private Double lat;
    private Double lng;
    @Column(length = 2000) private String trustedDevices = "";
}
