package com.example.backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PostResponse {
    private String id;
    private String userId;
    private String userName;
    private String userProfilePicture;
    private String content;
    private String videoUrl;
    private List<String> imageUrls = new ArrayList<>();
    private List<String> mediaIds = new ArrayList<>();
    private List<String> comments = new ArrayList<>();
    private LocalDateTime createdAt;
    private int likeCount;
    private boolean isLiked;
    private Reaction userReaction;
    private Map<String, Integer> reactionCounts = new HashMap<>();

    public PostResponse() {
    }

    public PostResponse(Post post) {
        this.id = post.getId();
        this.userId = post.getUserId();
        this.content = post.getContent();
        this.videoUrl = post.getVideoUrl();
        this.imageUrls = post.getImageUrls();
        this.mediaIds = post.getMediaIds();
        this.comments = post.getComments();
        this.createdAt = post.getCreatedAt();
    }

    public PostResponse(Post post, String currentUserId) {
        this.id = post.getId();
        this.userId = post.getUserId();
        this.content = post.getContent();
        this.videoUrl = post.getVideoUrl();
        this.imageUrls = post.getImageUrls();
        this.mediaIds = post.getMediaIds();
        this.comments = post.getComments();
        this.createdAt = post.getCreatedAt();
        this.likeCount = post.getLikeCount();
        this.isLiked = post.isLikedByUser(currentUserId);
        this.userReaction = post.getUserReaction(currentUserId);
        this.reactionCounts = post.getReactionCounts();
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

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserProfilePicture() {
        return userProfilePicture;
    }

    public void setUserProfilePicture(String userProfilePicture) {
        this.userProfilePicture = userProfilePicture;
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

    public int getLikeCount() {
        return this.likeCount;
    }

    public void setLikeCount(int likeCount) {
        this.likeCount = likeCount;
    }

    public boolean getIsLiked() {
        return this.isLiked;
    }

    public void setIsLiked(boolean isLiked) {
        this.isLiked = isLiked;
    }

    public Reaction getUserReaction() {
        return userReaction;
    }

    public void setUserReaction(Reaction userReaction) {
        this.userReaction = userReaction;
    }

    public Map<String, Integer> getReactionCounts() {
        return reactionCounts;
    }

    public void setReactionCounts(Map<String, Integer> reactionCounts) {
        this.reactionCounts = reactionCounts != null ? reactionCounts : new HashMap<>();
    }
}