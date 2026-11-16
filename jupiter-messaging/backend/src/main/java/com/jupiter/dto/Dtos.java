package com.jupiter.dto;

import java.util.List;

/** All request/response shapes. Timestamps are ISO-8601 strings so REST and STOMP agree. */
public final class Dtos {
    private Dtos() {}

    public record UserDto(Long id, String username, String avatarUrl, String bannerUrl, String bio, boolean online,
                          String noteText, String noteExpiresAt, boolean shareLocation,
                          String city, String country, Double lat, Double lng) {}
    public record MessageDto(Long id, Long channelId, UserDto author, String content, String createdAt) {}
    public record ChannelDto(Long id, String name, String type, Long serverId, List<UserDto> members) {}
    public record ServerDto(Long id, String name, String iconUrl, String inviteCode, Long ownerId, List<ChannelDto> channels) {}
    public record AuthResponse(String token, UserDto user, boolean needsVerification, String email) {}

    public record RegisterReq(String email, String username, String password) {}
    public record LoginReq(String identifier, String password, String deviceId) {}
    public record VerifyReq(String email, String code, String deviceId) {}
    public record ResendReq(String email) {}
    public record ProfileReq(String avatarUrl, String bannerUrl, String bio, boolean shareLocation,
                             String city, String country, Double lat, Double lng) {}
    public record NoteReq(String text) {}
    public record ServerReq(String name, String iconUrl) {}
    public record JoinReq(String code) {}
    public record ChannelReq(String name, String type) {}
    public record DmReq(List<Long> userIds, String name) {}
    public record SendMsg(Long channelId, String content) {}
    public record TypingMsg(Long channelId) {}
}
