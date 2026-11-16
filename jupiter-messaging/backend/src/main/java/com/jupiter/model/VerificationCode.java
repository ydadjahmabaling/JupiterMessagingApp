package com.jupiter.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "verification_codes") @Getter @Setter @NoArgsConstructor
public class VerificationCode {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String email;
    @Column(nullable = false, length = 6) private String code;
    @Column(nullable = false) private Instant expiresAt;
    private boolean used;
}
