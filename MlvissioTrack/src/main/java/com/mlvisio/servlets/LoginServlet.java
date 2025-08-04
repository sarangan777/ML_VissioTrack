package com.mlvisio.servlets;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.mlvisio.util.FirebaseInitializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mindrot.jbcrypt.BCrypt;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "LoginServlet", urlPatterns = {"/api/login"})
public class LoginServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private ObjectMapper objectMapper;

    @Override
    public void init() throws ServletException {
        System.out.println("✅ [LoginServlet] Initializing...");
        try {
            FirebaseInitializer.initialize();
            this.objectMapper = new ObjectMapper();
            System.out.println("✅ [LoginServlet] Firebase initialized successfully.");
        } catch (Exception e) {
            System.err.println("❌ [LoginServlet] Firebase init failed:");
            e.printStackTrace();
            throw new ServletException("Firebase initialization failed in LoginServlet", e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        // Add CORS headers
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            // Read request body
            StringBuilder sb = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> jsonRequest = objectMapper.readValue(sb.toString(), Map.class);
            String email = (String) jsonRequest.get("email");
            String password = (String) jsonRequest.get("password");

            // Validate input
            if (email == null || email.isEmpty() || password == null || password.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                jsonResponse.put("success", false);
                jsonResponse.put("message", "Email and password are required.");
                objectMapper.writeValue(response.getWriter(), jsonResponse);
                return;
            }

            // Firestore lookup
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection("users")
                    .whereEqualTo("email", email)
                    .get();

            List<QueryDocumentSnapshot> documents = future.get().getDocuments();

            if (documents.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                jsonResponse.put("success", false);
                jsonResponse.put("message", "Invalid email or password.");
            } else {
                DocumentSnapshot userDoc = documents.get(0);
                String storedHash = userDoc.getString("password");

                if (storedHash != null && BCrypt.checkpw(password, storedHash)) {
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("id", userDoc.getId());
                    userData.put("email", userDoc.getString("email"));
                    userData.put("name", userDoc.getString("name"));
                    userData.put("registrationNumber", userDoc.getString("registrationNumber"));
                    userData.put("department", userDoc.getString("department"));
                    userData.put("birthDate", userDoc.getString("birthDate"));
                    userData.put("year", userDoc.getString("year"));
                    userData.put("type", userDoc.getString("type"));
                    userData.put("role", userDoc.contains("role") ? userDoc.getString("role") : "student");
                    userData.put("joinDate", userDoc.getTimestamp("createdAt"));

                    Map<String, Object> responseData = new HashMap<>();
                    responseData.put("user", userData);
                    responseData.put("token", "jwt-token-" + System.currentTimeMillis());

                    jsonResponse.put("success", true);
                    jsonResponse.put("message", "Login successful.");
                    jsonResponse.put("data", responseData);
                    
                    System.out.println("✅ Login successful for: " + email);
                } else {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    jsonResponse.put("success", false);
                    jsonResponse.put("message", "Invalid email or password.");
                    System.out.println("❌ Invalid password for: " + email);
                }
            }

        } catch (Exception e) {
            System.err.println("❌ Login error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            jsonResponse.put("success", false);
            jsonResponse.put("message", "Server error: " + e.getMessage());
        }

        objectMapper.writeValue(response.getWriter(), jsonResponse);
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        response.setStatus(HttpServletResponse.SC_OK);
    }

}