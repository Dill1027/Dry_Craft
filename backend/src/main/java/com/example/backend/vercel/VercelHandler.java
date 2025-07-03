package com.example.backend.vercel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.example.backend")
public class VercelHandler extends SpringBootServletInitializer {
    
    public static void main(String[] args) {
        SpringApplication.run(VercelHandler.class, args);
    }
}
