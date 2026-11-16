package com.jupiter.repo;

import com.jupiter.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;

public interface ServerMemberRepository extends JpaRepository<ServerMember, Long> {
    List<ServerMember> findByUserId(Long userId);
    List<ServerMember> findByServerId(Long serverId);
    boolean existsByServerIdAndUserId(Long serverId, Long userId);
}
