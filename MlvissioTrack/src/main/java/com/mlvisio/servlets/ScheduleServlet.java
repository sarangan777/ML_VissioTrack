package com.mlvisio.servlets;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.mlvisio.util.FirebaseInitializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.concurrent.ExecutionException;

@WebServlet(name = "ScheduleServlet", urlPatterns = {"/api/schedule/*"})
public class ScheduleServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private ObjectMapper objectMapper;

    @Override
    public void init() throws ServletException {
        System.out.println("✅ [ScheduleServlet] Initializing...");
        try {
            FirebaseInitializer.initialize();
            this.objectMapper = new ObjectMapper();
            System.out.println("✅ [ScheduleServlet] Firebase initialized successfully.");
        } catch (Exception e) {
            System.err.println("❌ [ScheduleServlet] Firebase init failed:");
            e.printStackTrace();
            throw new ServletException("Firebase initialization failed in ScheduleServlet", e);
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
        System.out.println("✅ [ScheduleServlet] GET request: " + pathInfo);
        
        try {
            Firestore db = FirestoreClient.getFirestore();
            
            if (pathInfo != null && pathInfo.equals("/week")) {
                handleWeeklySchedule(request, response, db);
            } else if (pathInfo != null && pathInfo.equals("/today")) {
                handleTodaySchedule(request, response, db);
            } else {
                handleAllSchedules(request, response, db);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [ScheduleServlet] Error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch schedule: " + e.getMessage());
            objectMapper.writeValue(response.getWriter(), errorResponse);
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
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        String pathInfo = request.getPathInfo();
        System.out.println("✅ [ScheduleServlet] POST request: " + pathInfo);
        
        try {
            if (pathInfo != null && pathInfo.equals("/create")) {
                handleCreateSchedule(request, response);
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Endpoint not found");
                objectMapper.writeValue(response.getWriter(), errorResponse);
            }
        } catch (Exception e) {
            System.err.println("❌ [ScheduleServlet] Error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to process request: " + e.getMessage());
            objectMapper.writeValue(response.getWriter(), errorResponse);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        // Add CORS headers
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        String pathInfo = request.getPathInfo();
        System.out.println("✅ [ScheduleServlet] PUT request: " + pathInfo);
        
        try {
            if (pathInfo != null && pathInfo.startsWith("/update/")) {
                String scheduleId = pathInfo.substring("/update/".length());
                handleUpdateSchedule(request, response, scheduleId);
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Endpoint not found");
                objectMapper.writeValue(response.getWriter(), errorResponse);
            }
        } catch (Exception e) {
            System.err.println("❌ [ScheduleServlet] Error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to process request: " + e.getMessage());
            objectMapper.writeValue(response.getWriter(), errorResponse);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        // Add CORS headers
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        String pathInfo = request.getPathInfo();
        System.out.println("✅ [ScheduleServlet] DELETE request: " + pathInfo);
        
        try {
            if (pathInfo != null && pathInfo.startsWith("/delete/")) {
                String scheduleId = pathInfo.substring("/delete/".length());
                handleDeleteSchedule(request, response, scheduleId);
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Endpoint not found");
                objectMapper.writeValue(response.getWriter(), errorResponse);
            }
        } catch (Exception e) {
            System.err.println("❌ [ScheduleServlet] Error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to process request: " + e.getMessage());
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

    private void handleTodaySchedule(HttpServletRequest request, HttpServletResponse response, Firestore db)
            throws IOException, ExecutionException, InterruptedException {
        
        // Get current day of week
        String currentDay = LocalDate.now().getDayOfWeek()
                .getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        System.out.println("📅 Fetching schedule for: " + currentDay);

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
                try {
                    ApiFuture<DocumentSnapshot> lecturerFuture = db.collection("lecturers")
                            .document(lecturerId).get();
                    DocumentSnapshot lecturerDoc = lecturerFuture.get();
                    if (lecturerDoc.exists()) {
                        schedule.put("lecturerName", lecturerDoc.getString("name"));
                    } else {
                        schedule.put("lecturerName", "Unknown Lecturer");
                    }
                } catch (Exception e) {
                    schedule.put("lecturerName", "Unknown Lecturer");
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

        System.out.println("✅ Found " + schedules.size() + " classes for today");
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private void handleWeeklySchedule(HttpServletRequest request, HttpServletResponse response, Firestore db)
            throws IOException, ExecutionException, InterruptedException {
        
        String department = request.getParameter("department");
        String year = request.getParameter("year");
        
        Query query = db.collection("schedules").whereEqualTo("isActive", true);
        
        if (department != null && !department.isEmpty()) {
            query = query.whereEqualTo("department", department);
        }
        
        if (year != null && !year.isEmpty()) {
            query = query.whereEqualTo("year", year);
        }
        
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        Map<String, List<Map<String, Object>>> weeklySchedule = new HashMap<>();
        String[] days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
        
        for (String day : days) {
            weeklySchedule.put(day, new ArrayList<>());
        }
        
        for (QueryDocumentSnapshot doc : documents) {
            String dayOfWeek = doc.getString("dayOfWeek");
            if (dayOfWeek != null && weeklySchedule.containsKey(dayOfWeek)) {
                Map<String, Object> schedule = new HashMap<>();
                schedule.put("id", doc.getId());
                schedule.put("subjectCode", doc.getString("subjectCode"));
                schedule.put("startTime", doc.getString("startTime"));
                schedule.put("endTime", doc.getString("endTime"));
                schedule.put("room", doc.getString("room"));
                schedule.put("lecturerId", doc.getString("lecturerId"));
                schedule.put("department", doc.getString("department"));
                schedule.put("year", doc.getString("year"));
                
                // Get lecturer name
                String lecturerId = doc.getString("lecturerId");
                if (lecturerId != null) {
                    try {
                        ApiFuture<DocumentSnapshot> lecturerFuture = db.collection("lecturers")
                                .document(lecturerId).get();
                        DocumentSnapshot lecturerDoc = lecturerFuture.get();
                        if (lecturerDoc.exists()) {
                            schedule.put("lecturerName", lecturerDoc.getString("name"));
                        }
                    } catch (Exception e) {
                        schedule.put("lecturerName", "Unknown Lecturer");
                    }
                }
                
                weeklySchedule.get(dayOfWeek).add(schedule);
            }
        }
        
        // Sort each day's schedule by start time
        for (List<Map<String, Object>> daySchedule : weeklySchedule.values()) {
            daySchedule.sort((a, b) -> {
                String timeA = (String) a.get("startTime");
                String timeB = (String) b.get("startTime");
                return timeA.compareTo(timeB);
            });
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("data", weeklySchedule);
        
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private void handleAllSchedules(HttpServletRequest request, HttpServletResponse response, Firestore db)
            throws IOException, ExecutionException, InterruptedException {
        
        ApiFuture<QuerySnapshot> future = db.collection("schedules")
                .whereEqualTo("isActive", true)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Map<String, Object>> schedules = new ArrayList<>();
        
        for (QueryDocumentSnapshot doc : documents) {
            Map<String, Object> schedule = new HashMap<>();
            schedule.put("id", doc.getId());
            schedule.put("subjectCode", doc.getString("subjectCode"));
            schedule.put("dayOfWeek", doc.getString("dayOfWeek"));
            schedule.put("startTime", doc.getString("startTime"));
            schedule.put("endTime", doc.getString("endTime"));
            schedule.put("room", doc.getString("room"));
            schedule.put("year", doc.getString("year"));
            schedule.put("lecturerId", doc.getString("lecturerId"));
            schedule.put("department", doc.getString("department"));
            schedules.add(schedule);
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("data", schedules);
        
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private void handleCreateSchedule(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ExecutionException, InterruptedException {
        
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> jsonRequest = objectMapper.readValue(sb.toString(), Map.class);
        
        String subjectCode = (String) jsonRequest.get("subject");
        String department = (String) jsonRequest.get("department");
        String dayOfWeek = (String) jsonRequest.get("day");
        String startTime = (String) jsonRequest.get("startTime");
        String endTime = (String) jsonRequest.get("endTime");
        String room = (String) jsonRequest.get("room");
        String lecturer = (String) jsonRequest.get("lecturer");
        String date = (String) jsonRequest.get("date");

        if (subjectCode == null || department == null || dayOfWeek == null || startTime == null || endTime == null || room == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Missing required fields: subject, department, day, startTime, endTime, room");
            objectMapper.writeValue(response.getWriter(), errorResponse);
            return;
        }

        Firestore db = FirestoreClient.getFirestore();
        
        // Find lecturer ID by name
        String lecturerId = null;
        if (lecturer != null) {
            ApiFuture<QuerySnapshot> lecturerQuery = db.collection("lecturers")
                    .whereEqualTo("name", lecturer)
                    .get();
            List<QueryDocumentSnapshot> lecturerDocs = lecturerQuery.get().getDocuments();
            if (!lecturerDocs.isEmpty()) {
                lecturerId = lecturerDocs.get(0).getString("lecturerId");
            }
        }

        String docId = subjectCode + "_" + dayOfWeek + "_" + startTime.replace(":", "");
        
        Map<String, Object> scheduleData = new HashMap<>();
        scheduleData.put("subjectCode", subjectCode);
        scheduleData.put("dayOfWeek", dayOfWeek);
        scheduleData.put("startTime", startTime);
        scheduleData.put("endTime", endTime);
        scheduleData.put("room", room);
        scheduleData.put("year", "2nd Year"); // Default for now
        scheduleData.put("lecturerId", lecturerId);
        scheduleData.put("department", department);
        scheduleData.put("isActive", true);
        scheduleData.put("createdAt", Timestamp.now());

        ApiFuture<WriteResult> future = db.collection("schedules")
                .document(docId).set(scheduleData);
        
        future.get(); // Wait for completion

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("message", "Schedule created successfully");
        responseData.put("data", scheduleData);

        System.out.println("✅ Schedule created: " + docId);
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private void handleUpdateSchedule(HttpServletRequest request, HttpServletResponse response, String scheduleId)
            throws IOException, ExecutionException, InterruptedException {
        
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> jsonRequest = objectMapper.readValue(sb.toString(), Map.class);
        
        Firestore db = FirestoreClient.getFirestore();
        
        // Update the schedule
        ApiFuture<WriteResult> future = db.collection("schedules")
                .document(scheduleId).update(jsonRequest);
        
        future.get(); // Wait for completion

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("message", "Schedule updated successfully");

        System.out.println("✅ Schedule updated: " + scheduleId);
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private void handleDeleteSchedule(HttpServletRequest request, HttpServletResponse response, String scheduleId)
            throws IOException, ExecutionException, InterruptedException {
        
        Firestore db = FirestoreClient.getFirestore();
        
        // Soft delete by setting isActive to false
        Map<String, Object> updates = new HashMap<>();
        updates.put("isActive", false);
        
        ApiFuture<WriteResult> future = db.collection("schedules")
                .document(scheduleId).update(updates);
        
        future.get(); // Wait for completion

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("message", "Schedule deleted successfully");

        System.out.println("✅ Schedule deleted: " + scheduleId);
        objectMapper.writeValue(response.getWriter(), responseData);
    }
}