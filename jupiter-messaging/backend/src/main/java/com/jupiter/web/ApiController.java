package com.jupiter.web;

import com.jupiter.dto.Dtos.*;
import com.jupiter.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api") @RequiredArgsConstructor
public class ApiController {
    private final ChatService chat;
    private Long uid(Authentication a) { return Long.valueOf(a.getName()); }

    @GetMapping("/me")            public UserDto me(Authentication a) { return chat.me(uid(a)); }
    @PutMapping("/me/profile")    public UserDto profile(Authentication a, @RequestBody ProfileReq r) { return chat.updateProfile(uid(a), r); }
    @PutMapping("/me/note")       public UserDto note(Authentication a, @RequestBody NoteReq r) { return chat.setNote(uid(a), r.text()); }
    @DeleteMapping("/me/note")    public UserDto clearNote(Authentication a) { return chat.setNote(uid(a), null); }
    @GetMapping("/users")         public List<UserDto> users() { return chat.allUsers(); }

    @GetMapping("/servers")       public List<ServerDto> servers(Authentication a) { return chat.myServers(uid(a)); }
    @PostMapping("/servers")      public ServerDto createServer(Authentication a, @RequestBody ServerReq r) { return chat.createServer(uid(a), r); }
    @PostMapping("/servers/join") public ServerDto join(Authentication a, @RequestBody JoinReq r) { return chat.joinServer(uid(a), r.code()); }
    @GetMapping("/servers/{id}/members")  public List<UserDto> members(Authentication a, @PathVariable Long id) { return chat.serverMembers(uid(a), id); }
    @PostMapping("/servers/{id}/channels") public ChannelDto addChannel(Authentication a, @PathVariable Long id, @RequestBody ChannelReq r) { return chat.addChannel(uid(a), id, r); }

    @GetMapping("/dms")           public List<ChannelDto> dms(Authentication a) { return chat.myDms(uid(a)); }
    @PostMapping("/dms")          public ChannelDto createDm(Authentication a, @RequestBody DmReq r) { return chat.createDm(uid(a), r); }

    @GetMapping("/channels/{id}/messages") public List<MessageDto> history(Authentication a, @PathVariable Long id) { return chat.history(uid(a), id); }
}
