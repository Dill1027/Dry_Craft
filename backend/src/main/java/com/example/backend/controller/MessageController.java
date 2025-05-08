package com.example.backend.controller;

import com.example.backend.model.Message;
import com.example.backend.model.MessageRequest;
import com.example.backend.model.ErrorResponse;
import com.example.backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageController {
    @Autowired
    private MessageService messageService;

    @PostMapping
    public ResponseEntity<Message> createMessage(@RequestBody MessageRequest request) {
        Message message = messageService.createMessage(
            request.getSellerId(), 
            request.getBuyerId(),
            request.getProductId(),
            request.getContent()
        );
        return ResponseEntity.ok(message);
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<Message>> getSellerMessages(@PathVariable String sellerId) {
        return ResponseEntity.ok(messageService.getSellerMessages(sellerId));
    }

    @GetMapping("/unread/{sellerId}")
    public ResponseEntity<List<Message>> getUnreadMessages(@PathVariable String sellerId) {
        return ResponseEntity.ok(messageService.getUnreadMessages(sellerId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Message> markAsRead(@PathVariable String id) {
        return ResponseEntity.ok(messageService.markAsRead(id));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<?> replyToMessage(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String replyContent = request.get("replyContent");
            if (replyContent == null || replyContent.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Reply content cannot be empty"));
            }
            Message reply = messageService.replyToMessage(id, replyContent);
            return ResponseEntity.ok(reply);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Error replying to message"));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserMessages(@PathVariable String userId) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("User ID cannot be null or empty"));
            }
            List<Message> messages = messageService.getUserMessages(userId);
            return ResponseEntity.ok(messages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Error fetching messages"));
        }
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<Message>> getBuyerMessages(@PathVariable String buyerId) {
        return ResponseEntity.ok(messageService.getBuyerMessages(buyerId));
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<Message>> getMessageHistory(@PathVariable String userId) {
        return ResponseEntity.ok(messageService.getMessageHistory(userId));
    }

    @GetMapping("/conversations/{userId}")
    public ResponseEntity<?> getGroupedConversations(@PathVariable String userId) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("User ID cannot be null or empty"));
            }
            List<Message> conversations = messageService.getGroupedConversations(userId);
            return ResponseEntity.ok(conversations);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Error fetching conversations: " + e.getMessage()));
        }
    }
}
