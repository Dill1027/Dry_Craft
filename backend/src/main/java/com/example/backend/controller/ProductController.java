package com.example.backend.controller;

import com.example.backend.model.Product;
import com.example.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Value("${upload.directory}")
    private String uploadDirectory;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDirectory));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory!", e);
        }
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createProduct(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("price") double price,
            @RequestParam("stock") int stock,
            @RequestParam("color") String color,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        try {
            String imageUrl = null;
            if (image != null && !image.isEmpty()) {
                String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
                Path uploadPath = Paths.get(uploadDirectory);
                
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                imageUrl = "/api/uploads/" + fileName;
            }

            Product product = new Product();
            product.setName(name);
            product.setDescription(description);
            product.setPrice(price);
            product.setStock(stock);
            product.setColor(color);
            product.setImageUrl(imageUrl);

            Product savedProduct = productRepository.save(product);
            return ResponseEntity.ok(savedProduct);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create product: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable String id, @RequestBody Product updatedProduct) {
        updatedProduct.setId(id);
        return productRepository.save(updatedProduct);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable String id) {
        productRepository.deleteById(id);
    }
}
