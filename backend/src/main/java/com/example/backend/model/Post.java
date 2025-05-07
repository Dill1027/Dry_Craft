package com.example.backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "posts")
public class Post {
    @Id
    private String id;
    private String userId;
    private String content;
    private String videoUrl;
    private List<String> imageUrls = new ArrayList<>();
    private List<String> mediaIds = new ArrayList<>(); // Store GridFS IDs
    private Set<String> likedByUsers = new HashSet<>(); // Replace the likes field
    private List<String> comments = new ArrayList<>();
    private LocalDateTime createdAt = LocalDateTime.now();
    private Map<String, Reaction> userReactions = new HashMap<>();
    private Map<String, Integer> reactionCounts = new HashMap<>();

    public Post() {
    }

    // Constructor for PostResponse
    public Post(String id, String userId, String content, String videoUrl, List<String> imageUrls,
            List<String> mediaIds, Set<String> likedByUsers, List<String> comments, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.content = content;
        this.videoUrl = videoUrl;
        this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
        this.mediaIds = mediaIds != null ? mediaIds : new ArrayList<>();
        this.likedByUsers = likedByUsers != null ? likedByUsers : new HashSet<>();
        this.comments = comments != null ? comments : new ArrayList<>();
        this.createdAt = createdAt;
    }

    // Getters and setters
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public List<String> getMediaIds() {
        return mediaIds;
    }

    public void setMediaIds(List<String> mediaIds) {
        this.mediaIds = mediaIds;
    }

    public Set<String> getLikedByUsers() {
        return likedByUsers;
    }

    public void setLikedByUsers(Set<String> likedByUsers) {
        this.likedByUsers = likedByUsers;
    }

    public int getLikeCount() {
        return likedByUsers != null ? likedByUsers.size() : 0;
    }

    public boolean isLikedByUser(String userId) {
        return likedByUsers != null && likedByUsers.contains(userId);
    }

    public List<String> getComments() {
        return comments;
    }

    public void setComments(List<String> comments) {
        this.comments = comments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Map<String, Reaction> getUserReactions() {
        return userReactions;
    }

    public void setUserReactions(Map<String, Reaction> userReactions) {
        this.userReactions = userReactions;
    }

    public Map<String, Integer> getReactionCounts() {
        if (reactionCounts == null) {
            reactionCounts = new HashMap<>();
            updateReactionCounts();
        }
        return reactionCounts;
    }

    public void setReactionCounts(Map<String, Integer> reactionCounts) {
        this.reactionCounts = reactionCounts;
    }

    public Reaction getUserReaction(String userId) {
        return userReactions != null ? userReactions.get(userId) : null;
    }

    public void updateReactionCounts() {
        Map<String, Integer> counts = new HashMap<>();
        if (userReactions != null) {
            for (Reaction reaction : userReactions.values()) {
                String reactionType = reaction.toString();
                counts.merge(reactionType, 1, Integer::sum);
            }
        }
        this.reactionCounts = counts;
    }
}