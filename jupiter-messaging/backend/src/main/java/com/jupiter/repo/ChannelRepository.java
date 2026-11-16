package com.jupiter.repo;

import com.jupiter.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;

public interface ChannelRepository extends JpaRepository<Channel, Long> {
    List<Channel> findByServerIdOrderById(Long serverId);
}
