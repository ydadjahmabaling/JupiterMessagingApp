package com.jupiter.repo;

import com.jupiter.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;

public interface ChannelMemberRepository extends JpaRepository<ChannelMember, Long> {
    List<ChannelMember> findByUserId(Long userId);
    List<ChannelMember> findByChannelId(Long channelId);
    boolean existsByChannelIdAndUserId(Long channelId, Long userId);
}
