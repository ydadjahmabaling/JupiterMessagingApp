package com.jupiter.repo;

import com.jupiter.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameIgnoreCase(String username);
    boolean existsByEmail(String email);
    boolean existsByUsernameIgnoreCase(String username);
    List<User> findByNoteTextNotNullAndNoteExpiresAtBefore(Instant t);
}
