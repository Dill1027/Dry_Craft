package com.example.backend.model;

public class TutorialStep {
    private int order;
    private String description;
    private String imageUrl;
    private String tip;

    public TutorialStep() {
    }

    public TutorialStep(int order, String description, String imageUrl, String tip) {
        this.order = order;
        this.description = description;
        this.imageUrl = imageUrl;
        this.tip = tip;
    }

    public int getOrder() {
        return order;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getTip() {
        return tip;
    }

    public void setTip(String tip) {
        this.tip = tip;
    }
}