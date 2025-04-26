package com.example.backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "user_progress")
public class UserProgress {
    @Id
    private String id;
    private String userId;
    private String tutorialId;
    private List<Integer> completedSteps;
    private LocalDateTime lastUpdated;
    private boolean isCompleted;

    public UserProgress() {
        this.completedSteps = new ArrayList<>();
        this.lastUpdated = LocalDateTime.now();
        this.isCompleted = false;
    }

    public UserProgress(String id, String userId, String tutorialId, List<Integer> completedSteps, LocalDateTime lastUpdated, boolean isCompleted) {
        this.id = id;
        this.userId = userId;
        this.tutorialId = tutorialId;
        this.completedSteps = completedSteps;
        this.lastUpdated = lastUpdated;
        this.isCompleted = isCompleted;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTutorialId() {
        return tutorialId;
    }

    public void setTutorialId(String tutorialId) {
        this.tutorialId = tutorialId;
    }

    public List<Integer> getCompletedSteps() {
        return completedSteps;
    }

    public void setCompletedSteps(List<Integer> completedSteps) {
        this.completedSteps = completedSteps;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public boolean isCompleted() {
        return isCompleted;
    }

    public void setCompleted(boolean isCompleted) {
        this.isCompleted = isCompleted;
    }
}