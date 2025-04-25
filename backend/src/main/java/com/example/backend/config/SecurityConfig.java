package com.example.backend.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.backend.service.CustomUserDetailsService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        return new CustomUserDetailsService();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/products/**").permitAll()
                .requestMatchers("/images/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/media/**").permitAll()
                .requestMatchers("/api/addproducts/**").permitAll()
                
            .requestMatchers(HttpMethod.POST, "/api/addproducts/**").permitAll()   // 🔥 ALLOW POST
            .requestMatchers(HttpMethod.PUT, "/api/addproducts/**").permitAll()    // 🔥 ALLOW PUT
            .requestMatchers(HttpMethod.DELETE, "/api/products/**").permitAll() // 🔥 ALLOW DELETE
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/media/**").permitAll()
           
                .requestMatchers("/api/productlist/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/posts/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/*/profile-picture").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .anyRequest().authenticated()
            )
            .httpBasic(httpBasic -> httpBasic.disable())  // 🔥 disable basic auth
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .anonymous(Customizer.withDefaults());         // 🔥 allow anonymous access

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:3001"
        ));
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"
        ));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", 
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "Cache-Control",
            "Pragma",
            "If-Modified-Since",
            "If-None-Match"
        ));
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Disposition",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
