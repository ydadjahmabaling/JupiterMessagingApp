package com.jupiter.config;

import com.jupiter.model.*;
import com.jupiter.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** Seeds a demo server, channels, users (with locations) and a few messages on the very first start. */
@Component @RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final ServerRepository servers;
    private final ServerMemberRepository sMembers;
    private final ChannelRepository channels;
    private final ChannelMemberRepository cMembers;
    private final MessageRepository messages;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        users.findAll().forEach(u -> { u.setOnline(false); users.save(u); });   // nobody is online after a restart
        if (users.count() > 0) return;

        User nova  = mk("nova",  "Building rockets and lo-fi playlists", "Tokyo", "Japan", 35.6762, 139.6503, true);
        User orion = mk("orion", "Backend dev. Coffee-powered.", "London", "United Kingdom", 51.5072, -0.1276, true);
        User luna  = mk("luna",  "Stargazer. Night owl.", "Sao Paulo", "Brazil", -23.5505, -46.6333, true);
        User atlas = mk("atlas", "Prefers to keep his location private.", "New York", "United States", 40.7128, -74.0060, false);
        nova.setNoteText("Listening to lo-fi 🚀");
        nova.setNoteExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
        orion.setNoteText("Grinding Java ☕");
        orion.setNoteExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
        users.save(nova); users.save(orion);

        Server s = new Server();
        s.setName("Jupiter HQ"); s.setInviteCode("JUPITER1"); s.setOwner(nova);
        servers.save(s);
        for (User u : new User[]{nova, orion, luna, atlas}) sMembers.save(new ServerMember(s, u));

        Channel general = mk(s, "general", ChannelType.TEXT);
        Channel random = mk(s, "random", ChannelType.TEXT);
        mk(s, "Lounge", ChannelType.VOICE);

        msg(general, nova, "Welcome to Jupiter HQ! 🪐 This message is stored in MySQL.", 50);
        msg(general, orion, "Real-time delivery over STOMP is working nicely.", 40);
        msg(general, luna, "Click anyone's avatar to see their spinning Earth.", 30);
        msg(random, atlas, "Anyone else watching the meteor shower tonight?", 20);

        Channel dm = new Channel(); dm.setName("dm"); dm.setType(ChannelType.DM); channels.save(dm);
        cMembers.save(new ChannelMember(dm, nova)); cMembers.save(new ChannelMember(dm, orion));
        msg(dm, orion, "Hey Nova, ready to ship Jupiter?", 10);
        msg(dm, nova, "Launching in T-minus 10.", 5);
    }

    private User mk(String name, String bio, String city, String country, double lat, double lng, boolean share) {
        User u = new User();
        u.setEmail(name + "@jupiter.dev"); u.setUsername(name); u.setBio(bio);
        u.setPasswordHash(encoder.encode("password123")); u.setVerified(true);
        u.setCity(city); u.setCountry(country); u.setLat(lat); u.setLng(lng); u.setShareLocation(share);
        return users.save(u);
    }
    private Channel mk(Server s, String name, ChannelType t) {
        Channel c = new Channel(); c.setServer(s); c.setName(name); c.setType(t); return channels.save(c);
    }
    private void msg(Channel c, User a, String text, int minutesAgo) {
        Message m = new Message(); m.setChannel(c); m.setAuthor(a); m.setContent(text);
        m.setCreatedAt(Instant.now().minus(minutesAgo, ChronoUnit.MINUTES)); messages.save(m);
    }
}
