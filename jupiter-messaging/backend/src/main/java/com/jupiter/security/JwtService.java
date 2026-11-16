package com.jupiter.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key;
    private final long hours;

    public JwtService(@Value("${jupiter.jwt.secret}") String secret, @Value("${jupiter.jwt.expiration-hours}") long hours) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.hours = hours;
    }

    public String create(Long userId) {
        return Jwts.builder().subject(String.valueOf(userId)).issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + hours * 3_600_000L)).signWith(key).compact();
    }

    /** @return the user id, or null if the token is invalid/expired */
    public Long parse(String token) {
        try {
            return Long.valueOf(Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject());
        } catch (Exception e) { return null; }
    }
}
