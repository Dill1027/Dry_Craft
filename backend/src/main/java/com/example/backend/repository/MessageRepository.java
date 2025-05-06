package com.example.backend.repository;

import com.example.backend.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findBySellerId(String sellerId);
    List<Message> findByBuyerId(String buyerId);
    List<Message> findBySellerIdAndIsReadFalse(String sellerId);
}
