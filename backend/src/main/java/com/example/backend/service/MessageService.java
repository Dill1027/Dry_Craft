package com.example.backend.service;

import com.example.backend.model.Message;
import com.example.backend.model.User;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;

    public Message createMessage(String sellerId, String buyerId, String productId, String content) {
        Message message = new Message();
        message.setSellerId(sellerId);
        message.setBuyerId(buyerId);
        // Set sender and receiver IDs same as seller/buyer for now
        message.setSenderId(sellerId); 
        message.setReceiverId(buyerId);
        message.setProductId(productId);
        message.setContent(content);
        message.setCreatedAt(LocalDateTime.now());
        message.setRead(false);
        return messageRepository.save(message);
    }
    
    public List<Message> getSellerMessages(String sellerId) {
        return messageRepository.findBySellerId(sellerId);
    }
    
    public List<Message> getUnreadMessages(String sellerId) {
        return messageRepository.findBySellerIdAndIsReadFalse(sellerId);
    }
    
    public Message markAsRead(String messageId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setRead(true);
        return messageRepository.save(message);
    }
    
    public List<Message> getConversation(String userId1, String userId2) {
        List<Message> messages = messageRepository.findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByCreatedAtDesc(
            userId1, userId2, userId2, userId1);
        return enrichMessagesWithUserNames(messages);
    }

    public List<Message> getUserMessages(String userId) {
        List<Message> messages = messageRepository.findByBuyerIdOrSellerIdOrderByCreatedAtDesc(userId, userId);
        return enrichMessagesWithUserNames(messages);
    }

    public Message replyToMessage(String originalMessageId, String content) {
        Message originalMessage = messageRepository.findById(originalMessageId)
            .orElseThrow(() -> new RuntimeException("Original message not found"));
        
        Message reply = new Message();
        // Set the IDs correctly for the reply
        reply.setSenderId(originalMessage.getReceiverId());
        reply.setReceiverId(originalMessage.getSenderId());
        // Keep the same seller/buyer relationship
        reply.setSellerId(originalMessage.getSellerId());
        reply.setBuyerId(originalMessage.getBuyerId());
        reply.setProductId(originalMessage.getProductId());
        reply.setContent(content);
        reply.setCreatedAt(LocalDateTime.now());
        reply.setRead(false);
        
        return messageRepository.save(reply);
    }

    private List<Message> enrichMessagesWithUserNames(List<Message> messages) {
        messages.forEach(message -> {
            if (message.getSellerId() != null) {
                User seller = userRepository.findById(message.getSellerId()).orElse(null);
                User buyer = userRepository.findById(message.getBuyerId()).orElse(null);
                if (seller != null) message.setSenderName(seller.getFirstName() + " " + seller.getLastName());
                if (buyer != null) message.setReceiverName(buyer.getFirstName() + " " + buyer.getLastName());
            }
        });
        return messages;
    }
}
