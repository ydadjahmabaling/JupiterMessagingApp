package com.jupiter.repo;

import com.jupiter.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findTop100ByChannelIdOrderByIdDesc(Long channelId);
}
