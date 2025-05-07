package com.example.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "comments")
public class Comment {
    @Id
    private String id;
    private String userId;
    private String content;
    private String authorName;
    private String parentId;
    private List<Comment> replies;
    private boolean isReply;
    
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    private LocalDateTime createdAt;

    public Comment() {
        this.createdAt = LocalDateTime.now();
        this.replies = new ArrayList<>();
    }

    public Comment(String userId, String content, String authorName) {
        this();
        this.userId = userId;
        this.content = content; 
        this.authorName = authorName;
    }

    public void addReply(Comment reply) {
        if (replies == null) {
            replies = new ArrayList<>();
        }
        reply.setParentId(this.id);
        reply.setIsReply(true);
        replies.add(reply);
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public List<Comment> getReplies() {
        return replies != null ? replies : new ArrayList<>();
    }

    public void setReplies(List<Comment> replies) {
        this.replies = replies;
    }

    public boolean isReply() {
        return isReply;
    }

    public void setIsReply(boolean isReply) {
        this.isReply = isReply;
    }
}