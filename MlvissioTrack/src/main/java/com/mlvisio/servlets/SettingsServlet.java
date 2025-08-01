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

@WebServlet(name = "SettingsServlet", urlPatterns = {"/api/settings/*"})
public class SettingsServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private ObjectMapper objectMapper;

    @Override
    public void init() throws ServletException {
        System.out.println("✅ [SettingsServlet] Initializing...");
        try {
            FirebaseInitializer.initialize();
            this.objectMapper = new ObjectMapper();
            System.out.println("✅ [SettingsServlet] Firebase initialized successfully.");
        } catch (Exception e) {
            System.err.println("❌ [SettingsServlet] Firebase init failed:");
            e.printStackTrace();
            throw new ServletException("Firebase initialization failed in SettingsServlet", e);
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

        String pathInfo = request.getPathInfo();
        System.out.println("✅ [SettingsServlet] GET request: " + pathInfo);
        
        try {
            Firestore db = FirestoreClient.getFirestore();
            
            if (pathInfo != null && pathInfo.equals("/attendanceGoal")) {
                handleGetAttendanceGoal(request, response, db);
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Endpoint not found");
                objectMapper.writeValue(response.getWriter(), errorResponse);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [SettingsServlet] Error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch settings: " + e.getMessage());
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

    private void handleGetAttendanceGoal(HttpServletRequest request, HttpServletResponse response, Firestore db)
            throws IOException, ExecutionException, InterruptedException {
        
        ApiFuture<DocumentSnapshot> future = db.collection("settings")
                .document("attendanceGoal").get();
        
        DocumentSnapshot document = future.get();
        
        Map<String, Object> goalData = new HashMap<>();
        if (document.exists()) {
            goalData.put("requiredPercentage", document.getLong("requiredPercentage"));
            goalData.put("description", document.getString("description"));
        } else {
            // Default values if not found
            goalData.put("requiredPercentage", 80);
            goalData.put("description", "Minimum attendance required for exam eligibility");
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("data", goalData);
        
        System.out.println("✅ Attendance goal retrieved: " + goalData.get("requiredPercentage") + "%");
        objectMapper.writeValue(response.getWriter(), responseData);
    }
}