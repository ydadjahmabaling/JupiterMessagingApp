package com.jupiter.web;

import com.jupiter.dto.Dtos.*;
import com.jupiter.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;

    @PostMapping("/register") public AuthResponse register(@RequestBody RegisterReq r) { return auth.register(r); }
    @PostMapping("/login")    public AuthResponse login(@RequestBody LoginReq r)       { return auth.login(r); }
    @PostMapping("/verify")   public AuthResponse verify(@RequestBody VerifyReq r)     { return auth.verify(r); }
    @PostMapping("/resend")   public Map<String, String> resend(@RequestBody ResendReq r) { auth.resend(r.email()); return Map.of("status", "sent"); }
}
