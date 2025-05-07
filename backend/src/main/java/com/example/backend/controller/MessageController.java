package com.example.backend.controller;

import com.example.backend.model.Message;
import com.example.backend.model.MessageRequest;
import com.example.backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
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
    
    @PostMapping("/reply/{messageId}")
    public ResponseEntity<Message> replyToMessage(
            @PathVariable String messageId,
            @RequestBody Map<String, String> request) {
        try {
            Message reply = messageService.replyToMessage(messageId, request.get("content"));
            return ResponseEntity.ok(reply);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Message>> getUserMessages(@PathVariable String userId) {
        return ResponseEntity.ok(messageService.getUserMessages(userId));
    }

    @GetMapping("/conversation/{userId1}/{userId2}")
    public ResponseEntity<List<Message>> getConversation(
            @PathVariable String userId1,
            @PathVariable String userId2) {
        return ResponseEntity.ok(messageService.getConversation(userId1, userId2));
    }
}
