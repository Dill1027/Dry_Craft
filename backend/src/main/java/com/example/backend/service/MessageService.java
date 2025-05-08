package com.example.backend.service;

import com.example.backend.model.Message;
import com.example.backend.model.User;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class MessageService {
    private static final Logger logger = Logger.getLogger(MessageService.class.getName());

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    public Message createMessage(String sellerId, String buyerId, String productId, String content) {
        Message message = new Message();
        message.setSellerId(sellerId);
        message.setBuyerId(buyerId);
        message.setSenderId(buyerId); // Set buyer as sender for initial message
        message.setReceiverId(sellerId); // Set seller as receiver for initial message
        message.setProductId(productId);
        message.setContent(content);
        message.setCreatedAt(LocalDateTime.now());
        message.setRead(false);

        Message savedMessage = messageRepository.save(message);
        List<Message> enriched = enrichMessagesWithUserNames(Collections.singletonList(savedMessage));
        return enriched.get(0);
    }

    public List<Message> getSellerMessages(String sellerId) {
        return messageRepository.findBySellerId(sellerId);
    }

    public List<Message> getBuyerMessages(String buyerId) {
        try {
            return messageRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch buyer messages: " + e.getMessage());
        }
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
        if (userId1 == null || userId2 == null) {
            logger.warning("Invalid user IDs provided for conversation");
            return new ArrayList<>();
        }
        try {
            List<Message> messages = messageRepository.findMessagesByUsers(userId1.trim(), userId2.trim());
            List<Message> enriched = enrichMessagesWithUserNames(messages);
            return enriched.stream()
                .sorted(Comparator.comparing(Message::getCreatedAt))
                .collect(Collectors.toList());
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error fetching conversation: " + e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    public List<Message> getUserMessages(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }

        try {
            List<Message> messages = messageRepository.findByBuyerIdOrSellerIdOrderByCreatedAtDesc(
                userId.trim(), userId.trim());

            if (messages == null) {
                return new ArrayList<>();
            }

            return enrichMessagesWithUserNames(messages);
        } catch (Exception e) {
            throw new RuntimeException("Error fetching user messages: " + e.getMessage());
        }
    }

    public Message replyToMessage(String originalMessageId, String content) {
        Message originalMessage = messageRepository.findById(originalMessageId)
            .orElseThrow(() -> new RuntimeException("Original message not found"));

        Message reply = new Message();
        reply.setSenderId(originalMessage.getReceiverId());
        reply.setReceiverId(originalMessage.getSenderId());
        reply.setSellerId(originalMessage.getSellerId());
        reply.setBuyerId(originalMessage.getBuyerId());
        reply.setProductId(originalMessage.getProductId());
        reply.setContent(content);
        reply.setCreatedAt(LocalDateTime.now());
        reply.setRead(false);

        return messageRepository.save(reply);
    }

    public List<Message> getMessageHistory(String userId) {
        List<Message> messages = messageRepository.findMessageHistory(userId);
        return enrichMessagesWithUserNames(messages);
    }

    public List<Message> getGroupedConversations(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }

        try {
            String trimmedUserId = userId.trim();
            List<Message> allMessages = messageRepository.findByBuyerIdOrSellerIdOrderByCreatedAtDesc(
                trimmedUserId, trimmedUserId);

            if (allMessages == null || allMessages.isEmpty()) {
                return new ArrayList<>();
            }

            Map<String, Message> latestMessages = new LinkedHashMap<>();

            for (Message message : allMessages) {
                if (message == null || message.getSenderId() == null || message.getReceiverId() == null) {
                    continue;
                }

                String partnerId;
                if (trimmedUserId.equals(message.getSenderId())) {
                    partnerId = message.getReceiverId();
                } else if (trimmedUserId.equals(message.getReceiverId())) {
                    partnerId = message.getSenderId();
                } else {
                    continue;
                }

                if (!latestMessages.containsKey(partnerId) ||
                    (message.getCreatedAt() != null &&
                     (latestMessages.get(partnerId).getCreatedAt() == null ||
                      message.getCreatedAt().isAfter(latestMessages.get(partnerId).getCreatedAt())))) {
                    latestMessages.put(partnerId, message);
                }
            }

            List<Message> conversations = new ArrayList<>(latestMessages.values());
            return enrichMessagesWithUserNames(conversations);
        } catch (Exception e) {
            throw new RuntimeException("Error processing conversations: " + e.getMessage(), e);
        }
    }

    private List<Message> enrichMessagesWithUserNames(List<Message> messages) {
        if (messages == null || messages.isEmpty()) {
            return new ArrayList<>();
        }

        Set<String> userIds = messages.stream()
            .flatMap(m -> Stream.of(m.getSenderId(), m.getReceiverId()))
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        Map<String, User> userMap = userRepository.findAllById(userIds)
            .stream()
            .collect(Collectors.toMap(
                User::getId,
                user -> user,
                (u1, u2) -> u1
            ));

        return messages.stream()
            .filter(Objects::nonNull)
            .peek(message -> {
                User sender = userMap.get(message.getSenderId());
                User receiver = userMap.get(message.getReceiverId());
                message.setSenderName(sender != null ? sender.getFirstName() + " " + sender.getLastName() : "Unknown User");
                message.setReceiverName(receiver != null ? receiver.getFirstName() + " " + receiver.getLastName() : "Unknown User");
            })
            .collect(Collectors.toList());
    }
}
