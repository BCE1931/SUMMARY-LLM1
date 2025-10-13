package com.example.demo.repository;

import com.example.demo.models.Users1;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Users1_repo extends JpaRepository<Users1, Integer> {
    boolean findByUsername(String username);

    Users1 getByUsername(String username);

    boolean existsByUsername(String username);
}
