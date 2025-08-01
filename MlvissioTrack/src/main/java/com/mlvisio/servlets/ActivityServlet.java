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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutionException;

@WebServlet(name = "ActivityServlet", urlPatterns = {"/api/activity/*"})
public class ActivityServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private ObjectMapper objectMapper;

    @Override
    public void init() throws ServletException {
        System.out.println("✅ [ActivityServlet] Initializing...");
        try {
            FirebaseInitializer.initialize();
            this.objectMapper = new ObjectMapper();
            System.out.println("✅ [ActivityServlet] Firebase initialized successfully.");
        } catch (Exception e) {
            System.err.println("❌ [ActivityServlet] Firebase init failed:");
            e.printStackTrace();
            throw new ServletException("Firebase initialization failed in ActivityServlet", e);
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
        System.out.println("✅ [ActivityServlet] GET request: " + pathInfo);
        
        try {
            Firestore db = FirestoreClient.getFirestore();
            
            if (pathInfo != null && pathInfo.equals("/recent")) {
                handleRecentActivity(request, response, db);
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Endpoint not found");
                objectMapper.writeValue(response.getWriter(), errorResponse);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [ActivityServlet] Error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch activity: " + e.getMessage());
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

    private void handleRecentActivity(HttpServletRequest request, HttpServletResponse response, Firestore db)
            throws IOException, ExecutionException, InterruptedException {
        
        // Get recent attendance records to generate activity feed
        ApiFuture<QuerySnapshot> future = db.collection("attendance")
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .limit(10)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Map<String, Object>> activities = new ArrayList<>();
        
        for (QueryDocumentSnapshot doc : documents) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("id", doc.getId());
            
            String status = doc.getString("status");
            String subjectCode = doc.getString("subjectCode");
            
            if ("Present".equals(status)) {
                activity.put("type", "check-in");
                activity.put("details", "Checked in for " + subjectCode + " class");
            } else if ("Absent".equals(status)) {
                activity.put("type", "check-out");
                activity.put("details", "Marked absent for " + subjectCode + " class");
            } else {
                activity.put("type", "check-in");
                activity.put("details", "Attendance recorded for " + subjectCode + " class");
            }
            
            activity.put("timestamp", doc.getTimestamp("timestamp").toDate().toInstant().toString());
            activities.add(activity);
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("data", activities);
        
        System.out.println("✅ Found " + activities.size() + " recent activities");
        objectMapper.writeValue(response.getWriter(), responseData);
    }
}