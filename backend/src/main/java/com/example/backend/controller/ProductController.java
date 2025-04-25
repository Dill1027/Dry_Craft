package com.example.backend.controller;

import com.example.backend.model.Product;
import com.example.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public Product createProduct(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("price") double price,
            @RequestParam("stock") int stock,
            @RequestParam("color") String color,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) throws IOException {

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
            String uploadDir = "uploads/";
            File uploadPath = new File(uploadDir);
            if (!uploadPath.exists()) {
                uploadPath.mkdirs();
            }
            File file = new File(uploadDir + fileName);
            image.transferTo(file);
            imageUrl = "/uploads/" + fileName;
        }

        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setStock(stock);
        product.setColor(color);
        product.setImageUrl(imageUrl);

        return productRepository.save(product);
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
