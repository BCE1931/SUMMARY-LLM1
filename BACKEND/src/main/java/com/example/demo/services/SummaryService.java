package com.example.demo.services;

import com.example.demo.models.Summary;
import com.example.demo.repository.Summry_repo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SummaryService {

    @Autowired
    private Summry_repo repo;

    public boolean saveSummary(Summary summary) {
        Summary summary1 = new Summary();
        summary1.setSummary(summary.getSummary());
        summary1.setText(summary.getText());
        summary1.setBlobUrl(summary.getBlobUrl());
        summary1.setAudioId(summary.getAudioId());
        summary1.setUsername(summary.getUsername());
        summary1.setBlobName(summary.getBlobName());
        summary1.setTitle(summary.getTitle());
        summary1.setPrompt(summary.getPrompt());
        repo.save(summary1);
        return true;
    }
}
