package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.Tutorial;
import com.example.backend.model.UserProgress;
import com.example.backend.model.ErrorResponse;
import com.example.backend.service.TutorialService;

@RestController
@RequestMapping("/api/tutorials")
@CrossOrigin(origins = {"http://localhost:3000"})
public class TutorialController {

    @Autowired
    private TutorialService tutorialService;

    @PostMapping
    public ResponseEntity<Tutorial> createTutorial(
            @RequestParam("userId") String userId,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("steps") List<String> steps,
            @RequestParam("materials") List<String> materials,
            @RequestParam("craftType") String craftType,
            @RequestParam(value = "video", required = false) MultipartFile video,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {
        try {
            Tutorial tutorial = tutorialService.createTutorial(
                userId, title, description, steps, materials, craftType, video, images);
            return ResponseEntity.ok(tutorial);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tutorial> getTutorialById(@PathVariable String id) {
        try {
            Tutorial tutorial = tutorialService.getTutorialById(id);
            return ResponseEntity.ok(tutorial);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Tutorial>> getAllTutorials() {
        try {
            List<Tutorial> tutorials = tutorialService.getAllTutorials();
            return ResponseEntity.ok(tutorials);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<?> getProgress(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            String userId = getUserIdFromToken(token);
            UserProgress progress = tutorialService.getUserProgress(userId, id);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/{id}/progress")
    public ResponseEntity<?> updateProgress(
            @PathVariable String id,
            @RequestBody Map<String, Integer> request,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            String userId = getUserIdFromToken(token);
            Integer stepIndex = request.get("stepIndex");
            if (stepIndex == null) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Step index is required"));
            }
            UserProgress progress = tutorialService.updateProgress(userId, id, stepIndex);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tutorial> updateTutorial(
            @PathVariable String id,
            @RequestBody Tutorial tutorial) {
        try {
            Tutorial updatedTutorial = tutorialService.updateTutorial(id, tutorial);
            return ResponseEntity.ok(updatedTutorial);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTutorial(@PathVariable String id) {
        try {
            tutorialService.deleteTutorial(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String getUserIdFromToken(String token) {
        if (token == null || token.isEmpty()) {
            throw new RuntimeException("Authorization token is required");
        }
        // For development, return user ID from token
        // In production, properly validate JWT token
        return token.replace("Bearer ", "");
    }
}
