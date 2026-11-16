package com.jupiter.repo;

import com.jupiter.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;

public interface ServerRepository extends JpaRepository<Server, Long> {
    Optional<Server> findByInviteCode(String code);
}
