package com.mlvisio.filters;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebFilter(filterName = "CorsFilter", urlPatterns = {"/*"})
public class CorsFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) {
        System.out.println("✅ [CorsFilter] Initialized");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletResponse res = (HttpServletResponse) response;
        HttpServletRequest req = (HttpServletRequest) request;

        // CORS headers for React frontend
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Max-Age", "3600");

        System.out.println("🔧 [CorsFilter] Processing " + req.getMethod() + " " + req.getRequestURI());

        // Handle preflight OPTIONS request
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            System.out.println("✅ [CorsFilter] Handling OPTIONS preflight request");
            res.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // Continue the filter chain
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        System.out.println("✅ [CorsFilter] Destroyed");
    }
}
