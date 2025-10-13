package com.example.demo.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Summary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String audioId;

    private String blobUrl;

    private String username;

    @Column(length = 2000)
    private String text;

    @Column(length = 2000)
    private String summary;

    private String blobName;

    private String title;

    private String prompt;

}
