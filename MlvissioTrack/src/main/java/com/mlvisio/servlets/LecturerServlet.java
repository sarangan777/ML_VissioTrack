package com.mlvisio.servlets;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.mlvisio.util.FirebaseInitializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutionException;

@WebServlet(name = "LecturerServlet", urlPatterns = {"/api/lecturers"})
public class LecturerServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private ObjectMapper objectMapper;

    @Override
    public void init() throws ServletException {
        System.out.println("✅ [LecturerServlet] Initializing...");
        try {
            FirebaseInitializer.initialize();
            this.objectMapper = new ObjectMapper();
            System.out.println("✅ [LecturerServlet] Firebase initialized successfully.");
        } catch (Exception e) {
            System.err.println("❌ [LecturerServlet] Firebase init failed:");
            e.printStackTrace();
            throw new ServletException("Firebase initialization failed in LecturerServlet", e);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        // Add CORS headers
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        System.out.println("✅ [LecturerServlet] GET request for lecturers");
        
        try {
            Firestore db = FirestoreClient.getFirestore();
            
            ApiFuture<QuerySnapshot> future = db.collection("lecturers").get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            
            List<Map<String, Object>> lecturers = new ArrayList<>();
            
            for (QueryDocumentSnapshot doc : documents) {
                Map<String, Object> lecturer = new HashMap<>();
                lecturer.put("id", doc.getId());
                lecturer.put("lecturerId", doc.getString("lecturerId"));
                lecturer.put("name", doc.getString("name"));
                lecturer.put("email", doc.getString("email"));
                lecturer.put("department", doc.getString("department"));
                lecturers.add(lecturer);
            }
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("data", lecturers);
            
            System.out.println("✅ Found " + lecturers.size() + " lecturers");
            objectMapper.writeValue(response.getWriter(), responseData);
            
        } catch (Exception e) {
            System.err.println("❌ [LecturerServlet] Error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch lecturers: " + e.getMessage());
            objectMapper.writeValue(response.getWriter(), errorResponse);
        }
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setStatus(HttpServletResponse.SC_OK);
    }
}