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
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.concurrent.ExecutionException;

@WebServlet("/api/schedule/today")
public class TodayScheduleServlet extends HttpServlet {

    @Override
    public void init() throws ServletException {
        try {
            FirebaseInitializer.initialize();
            System.out.println("✅ [TodayScheduleServlet] Firebase initialized successfully.");
        } catch (Exception e) {
            System.err.println("❌ [TodayScheduleServlet] Firebase init failed:");
            e.printStackTrace();
            throw new ServletException("Firebase initialization failed in TodayScheduleServlet", e);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            Firestore db = FirestoreClient.getFirestore();
            
            // Get current day of week
            String currentDay = LocalDate.now().getDayOfWeek()
                    .getDisplayName(TextStyle.FULL, Locale.ENGLISH);

            // Query schedules for today
            ApiFuture<QuerySnapshot> future = db.collection("schedules")
                    .whereEqualTo("dayOfWeek", currentDay)
                    .whereEqualTo("isActive", true)
                    .get();

            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            List<Map<String, Object>> schedules = new ArrayList<>();

            for (QueryDocumentSnapshot doc : documents) {
                Map<String, Object> schedule = new HashMap<>();
                schedule.put("id", doc.getId());
                schedule.put("subjectCode", doc.getString("subjectCode"));
                schedule.put("startTime", doc.getString("startTime"));
                schedule.put("endTime", doc.getString("endTime"));
                schedule.put("room", doc.getString("room"));
                schedule.put("year", doc.getString("year"));
                schedule.put("lecturerId", doc.getString("lecturerId"));
                schedule.put("department", doc.getString("department"));
                
                // Get lecturer name
                String lecturerId = doc.getString("lecturerId");
                if (lecturerId != null) {
                    ApiFuture<DocumentSnapshot> lecturerFuture = db.collection("lecturers")
                            .document(lecturerId).get();
                    DocumentSnapshot lecturerDoc = lecturerFuture.get();
                    if (lecturerDoc.exists()) {
                        schedule.put("lecturerName", lecturerDoc.getString("name"));
                    }
                }
                
                schedules.add(schedule);
            }

            // Sort by start time
            schedules.sort((a, b) -> {
                String timeA = (String) a.get("startTime");
                String timeB = (String) b.get("startTime");
                return timeA.compareTo(timeB);
            });

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("data", schedules);
            responseData.put("day", currentDay);

            new ObjectMapper().writeValue(response.getWriter(), responseData);

        } catch (InterruptedException | ExecutionException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch today's schedule: " + e.getMessage());
            new ObjectMapper().writeValue(response.getWriter(), errorResponse);
        }
    }
}