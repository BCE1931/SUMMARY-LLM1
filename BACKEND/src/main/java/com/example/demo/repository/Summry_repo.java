package com.example.demo.repository;

import com.example.demo.models.Summary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface Summry_repo extends JpaRepository<Summary , Integer> {
    List<Summary> findAllByUsername(String username);

    Summary findByIdAndUsername(Integer id, String username);
}
