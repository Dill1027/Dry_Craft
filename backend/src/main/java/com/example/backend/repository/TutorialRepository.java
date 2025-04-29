package com.example.backend.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.model.Tutorial;

public interface TutorialRepository extends MongoRepository<Tutorial, String> {
    // Default CRUD methods are provided by MongoRepository
}
