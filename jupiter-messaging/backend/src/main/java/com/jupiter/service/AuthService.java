package com.jupiter.service;

import com.jupiter.dto.Dtos.*;
import com.jupiter.model.*;
import com.jupiter.repo.*;
import com.jupiter.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;

import static com.jupiter.service.ChatService.bad;

@Service @RequiredArgsConstructor @Slf4j
public class AuthService {
    private final UserRepository users;
    private final VerificationCodeRepository codes;
    private final ServerRepository servers;
    private final ServerMemberRepository sMembers;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final ChatService chat;
    @Value("${jupiter.auth.verify-new-devices}") private boolean verifyNewDevices;
    @Value("${jupiter.demo-invite}") private String demoInvite;
    private final SecureRandom rnd = new SecureRandom();

    public AuthResponse register(RegisterReq r) {
        String email = r.email() == null ? "" : r.email().trim().toLowerCase();
        String name = r.username() == null ? "" : r.username().trim();
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) throw bad("Enter a valid email address");
        if (name.length() < 3 || name.length() > 32) throw bad("Username must be 3-32 characters");
        if (r.password() == null || r.password().length() < 6) throw bad("Password must be at least 6 characters");
        if (users.existsByEmail(email)) throw bad("That email is already registered");
        if (users.existsByUsernameIgnoreCase(name)) throw bad("That username is taken");
        User u = new User();
        u.setEmail(email); u.setUsername(name); u.setPasswordHash(encoder.encode(r.password()));
        users.save(u);
        sendCode(email);
        return new AuthResponse(null, null, true, email);
    }

    public AuthResponse login(LoginReq r) {
        String id = r.identifier() == null ? "" : r.identifier().trim();
        User u = users.findByEmail(id.toLowerCase()).or(() -> users.findByUsernameIgnoreCase(id))
                .orElseThrow(() -> bad("Invalid credentials"));
        if (!encoder.matches(r.password() == null ? "" : r.password(), u.getPasswordHash())) throw bad("Invalid credentials");
        if (!u.isVerified() || (verifyNewDevices && !trusted(u, r.deviceId()))) {
            sendCode(u.getEmail());
            return new AuthResponse(null, null, true, u.getEmail());
        }
        return success(u);
    }

    public AuthResponse verify(VerifyReq r) {
        String email = r.email() == null ? "" : r.email().trim().toLowerCase();
        VerificationCode c = codes.findTopByEmailAndUsedFalseOrderByIdDesc(email).orElseThrow(() -> bad("No pending code - request a new one"));
        if (c.getExpiresAt().isBefore(Instant.now())) throw bad("That code has expired - request a new one");
        if (r.code() == null || !c.getCode().equals(r.code().trim())) throw bad("Incorrect code");
        c.setUsed(true); codes.save(c);
        User u = users.findByEmail(email).orElseThrow(() -> bad("Unknown account"));
        boolean first = !u.isVerified();
        u.setVerified(true);
        if (r.deviceId() != null && !trusted(u, r.deviceId())) u.setTrustedDevices(u.getTrustedDevices() + r.deviceId() + ",");
        users.save(u);
        if (first) servers.findByInviteCode(demoInvite).ifPresent(s -> {
            if (!sMembers.existsByServerIdAndUserId(s.getId(), u.getId())) sMembers.save(new ServerMember(s, u));
        });
        return success(u);
    }

    public void resend(String email) {
        if (email != null && users.findByEmail(email.trim().toLowerCase()).isPresent()) sendCode(email.trim().toLowerCase());
    }

    private boolean trusted(User u, String deviceId) {
        return deviceId != null && Arrays.asList(u.getTrustedDevices().split(",")).contains(deviceId);
    }

    private AuthResponse success(User u) { return new AuthResponse(jwt.create(u.getId()), chat.dto(u, true), false, u.getEmail()); }

    /** DEV MODE: the code is printed to the console instead of being emailed. Plug Spring Mail in here for real SMTP. */
    private void sendCode(String email) {
        VerificationCode c = new VerificationCode();
        c.setEmail(email);
        c.setCode(String.format("%06d", rnd.nextInt(1_000_000)));
        c.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        codes.save(c);
        log.info("\n\n  ========================================================\n   JUPITER VERIFICATION CODE for {}:   {}\n   (valid for 10 minutes)\n  ========================================================\n", email, c.getCode());
    }
}
