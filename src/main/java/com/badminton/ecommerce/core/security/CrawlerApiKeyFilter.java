package com.badminton.ecommerce.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class CrawlerApiKeyFilter extends OncePerRequestFilter {

    @Value("${crawler.api-key}")
    private String expectedApiKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String apiKey = request.getHeader("X-Crawler-Key");

        if (apiKey != null && apiKey.equals(expectedApiKey)) {
            // Tạo authentication object cho Crawler
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    "crawler",
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_CRAWLER"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
