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
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutionException;

@WebServlet(name = "AttendanceServlet", urlPatterns = {"/api/attendance/*"})
public class AttendanceServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private ObjectMapper objectMapper;

    @Override
    public void init() throws ServletException {
        System.out.println("✅ [AttendanceServlet] Initializing...");
        try {
            FirebaseInitializer.initialize();
            this.objectMapper = new ObjectMapper();
            System.out.println("✅ [AttendanceServlet] Firebase initialized successfully.");
        } catch (Exception e) {
            System.err.println("❌ [AttendanceServlet] Firebase init failed:");
            e.printStackTrace();
            throw new ServletException("Firebase initialization failed in AttendanceServlet", e);
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
        System.out.println("✅ [AttendanceServlet] GET request: " + pathInfo);
        
        try {
            Firestore db = FirestoreClient.getFirestore();
            
            if (pathInfo != null && pathInfo.equals("/report")) {
                handleAttendanceReport(request, response, db);
            } else if (pathInfo != null && pathInfo.equals("/student")) {
                handleStudentAttendance(request, response, db);
            } else if (pathInfo != null && pathInfo.equals("/streak")) {
                handleAttendanceStreak(request, response, db);
            } else {
                handleAllAttendance(request, response, db);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [AttendanceServlet] Error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch attendance: " + e.getMessage());
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
        System.out.println("✅ [AttendanceServlet] POST request: " + pathInfo);
        
        try {
            if (pathInfo != null && pathInfo.equals("/mark")) {
                handleMarkAttendance(request, response);
            } else if (pathInfo != null && pathInfo.equals("/review")) {
                handleReviewRequest(request, response);
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Endpoint not found");
                objectMapper.writeValue(response.getWriter(), errorResponse);
            }
        } catch (Exception e) {
            System.err.println("❌ [AttendanceServlet] Error: " + e.getMessage());
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

    private void handleStudentAttendance(HttpServletRequest request, HttpServletResponse response, Firestore db)
            throws IOException, ExecutionException, InterruptedException {
        
        String studentEmail = request.getParameter("email");
        String startDate = request.getParameter("startDate");
        String endDate = request.getParameter("endDate");
        System.out.println("📊 Fetching attendance for student: " + studentEmail);
        
        if (studentEmail == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Student email is required");
            objectMapper.writeValue(response.getWriter(), errorResponse);
            return;
        }

        // Get student info first
        ApiFuture<QuerySnapshot> userQuery = db.collection("users")
                .whereEqualTo("email", studentEmail)
                .get();
        
        List<QueryDocumentSnapshot> userDocs = userQuery.get().getDocuments();
        if (userDocs.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Student not found");
            objectMapper.writeValue(response.getWriter(), errorResponse);
            return;
        }

        String studentId = userDocs.get(0).getId();
        
        // Get attendance records for this student
        Query attendanceQuery = db.collection("attendance")
                .whereEqualTo("studentId", studentId)
                .orderBy("date", Query.Direction.DESCENDING);
        
        // Add date filters if provided
        if (startDate != null && !startDate.isEmpty()) {
            attendanceQuery = attendanceQuery.whereGreaterThanOrEqualTo("date", startDate);
        }
        if (endDate != null && !endDate.isEmpty()) {
            attendanceQuery = attendanceQuery.whereLessThanOrEqualTo("date", endDate);
        }
        
        ApiFuture<QuerySnapshot> future = attendanceQuery.get();
        List<QueryDocumentSnapshot> attendanceDocs = future.get().getDocuments();
        List<Map<String, Object>> attendanceRecords = new ArrayList<>();
        
        for (QueryDocumentSnapshot doc : attendanceDocs) {
            Map<String, Object> record = new HashMap<>();
            record.put("id", doc.getId());
            record.put("date", doc.getString("date"));
            record.put("status", doc.getString("status"));
            record.put("subjectCode", doc.getString("subjectCode"));
            
            // Format arrival time from timestamp
            Timestamp timestamp = doc.getTimestamp("timestamp");
            if (timestamp != null) {
                record.put("arrivalTime", formatTime(timestamp));
            } else {
                record.put("arrivalTime", "-");
            }
            
            record.put("location", doc.getString("location"));
            record.put("confidence", doc.getDouble("confidence"));
            attendanceRecords.add(record);
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("data", attendanceRecords);
        
        System.out.println("✅ Found " + attendanceRecords.size() + " attendance records");
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private void handleAttendanceStreak(HttpServletRequest request, HttpServletResponse response, Firestore db)
            throws IOException, ExecutionException, InterruptedException {
        
        String studentEmail = request.getParameter("email");
        System.out.println("📊 Calculating attendance streak for: " + studentEmail);
        
        if (studentEmail == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Student email is required");
            objectMapper.writeValue(response.getWriter(), errorResponse);
            return;
        }

        // Get student info first
        ApiFuture<QuerySnapshot> userQuery = db.collection("users")
                .whereEqualTo("email", studentEmail)
                .get();
        
        List<QueryDocumentSnapshot> userDocs = userQuery.get().getDocuments();
        if (userDocs.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Student not found");
            objectMapper.writeValue(response.getWriter(), errorResponse);
            return;
        }

        String studentId = userDocs.get(0).getId();
        
        // Get attendance records for this student, ordered by date descending
        ApiFuture<QuerySnapshot> attendanceQuery = db.collection("attendance")
                .whereEqualTo("studentId", studentId)
                .orderBy("date", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> attendanceDocs = attendanceQuery.get().getDocuments();
        
        // Calculate streak
        int streak = 0;
        String previousDate = null;
        
        for (QueryDocumentSnapshot doc : attendanceDocs) {
            String date = doc.getString("date");
            String status = doc.getString("status");
            
            if ("Present".equals(status)) {
                if (previousDate == null || isConsecutiveDay(date, previousDate)) {
                    streak++;
                    previousDate = date;
                } else {
                    break; // Streak broken
                }
            } else {
                break; // Streak broken by absence
            }
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("data", Map.of("streak", streak));
        
        System.out.println("✅ Calculated streak: " + streak + " days");
        objectMapper.writeValue(response.getWriter(), responseData);
    }
    
    private boolean isConsecutiveDay(String currentDate, String previousDate) {
        try {
            LocalDate current = LocalDate.parse(currentDate);
            LocalDate previous = LocalDate.parse(previousDate);
            return current.plusDays(1).equals(previous);
        } catch (Exception e) {
            return false;
        }
    }

    private void handleAttendanceReport(HttpServletRequest request, HttpServletResponse response, Firestore db)
            throws IOException, ExecutionException, InterruptedException {
        
        String studentEmail = request.getParameter("email");
        String startDate = request.getParameter("startDate");
        String endDate = request.getParameter("endDate");
        String department = request.getParameter("department");
        
        Query query = db.collection("attendance");
        
        // If specific student email is provided, get their attendance
        if (studentEmail != null && !studentEmail.isEmpty()) {
            // Get student ID from email
            ApiFuture<QuerySnapshot> userQuery = db.collection("users")
                    .whereEqualTo("email", studentEmail)
                    .get();
            
            List<QueryDocumentSnapshot> userDocs = userQuery.get().getDocuments();
            if (!userDocs.isEmpty()) {
                String studentId = userDocs.get(0).getId();
                query = query.whereEqualTo("studentId", studentId);
            }
        }
        
        // Add date filters
        if (startDate != null && !startDate.isEmpty()) {
            query = query.whereGreaterThanOrEqualTo("date", startDate);
        }
        if (endDate != null && !endDate.isEmpty()) {
            query = query.whereLessThanOrEqualTo("date", endDate);
        }
        
        ApiFuture<QuerySnapshot> future = query.orderBy("date", Query.Direction.DESCENDING).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Map<String, Object>> attendanceRecords = new ArrayList<>();
        
        for (QueryDocumentSnapshot doc : documents) {
            String studentId = doc.getString("studentId");
            
            // Get student details
            Map<String, Object> studentInfo = new HashMap<>();
            try {
                ApiFuture<DocumentSnapshot> studentDoc = db.collection("users")
                        .document(studentId).get();
                DocumentSnapshot student = studentDoc.get();
                if (student.exists()) {
                    studentInfo.put("name", student.getString("name"));
                    studentInfo.put("email", student.getString("email"));
                    studentInfo.put("registrationNumber", student.getString("registrationNumber"));
                    studentInfo.put("department", student.getString("department"));
                }
            } catch (Exception e) {
                System.err.println("Error fetching student info: " + e.getMessage());
            }
            
            Map<String, Object> record = new HashMap<>();
            record.put("id", doc.getId());
            record.put("studentId", studentId);
            record.put("studentInfo", studentInfo);
            record.put("date", doc.getString("date"));
            record.put("status", doc.getString("status"));
            record.put("subjectCode", doc.getString("subjectCode"));
            
            Timestamp timestamp = doc.getTimestamp("timestamp");
            if (timestamp != null) {
                record.put("arrivalTime", formatTime(timestamp));
                record.put("timestamp", timestamp);
            } else {
                record.put("arrivalTime", "-");
            }
            
            record.put("location", doc.getString("location"));
            record.put("confidence", doc.getDouble("confidence"));
            attendanceRecords.add(record);
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("data", attendanceRecords);
        
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private void handleAllAttendance(HttpServletRequest request, HttpServletResponse response, Firestore db)
            throws IOException, ExecutionException, InterruptedException {
        
        String date = request.getParameter("date");
        if (date == null) {
            date = LocalDate.now().toString();
        }
        
        ApiFuture<QuerySnapshot> future = db.collection("attendance")
                .whereEqualTo("date", date)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Map<String, Object>> attendanceRecords = new ArrayList<>();
        
        for (QueryDocumentSnapshot doc : documents) {
            Map<String, Object> record = new HashMap<>();
            record.put("id", doc.getId());
            record.put("studentId", doc.getString("studentId"));
            record.put("status", doc.getString("status"));
            record.put("subjectCode", doc.getString("subjectCode"));
            record.put("timestamp", doc.getTimestamp("timestamp"));
            record.put("location", doc.getString("location"));
            attendanceRecords.add(record);
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("data", attendanceRecords);
        responseData.put("date", date);
        
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private void handleMarkAttendance(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ExecutionException, InterruptedException {
        
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> jsonRequest = objectMapper.readValue(sb.toString(), Map.class);
        String studentId = (String) jsonRequest.get("studentId");
        String subjectCode = (String) jsonRequest.get("subjectCode");
        String status = jsonRequest.get("status") != null ? (String) jsonRequest.get("status") : "Present";
        String location = jsonRequest.get("location") != null ? (String) jsonRequest.get("location") : "Unknown";

        if (studentId == null || studentId.isEmpty() || subjectCode == null || subjectCode.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Student ID and subject code are required");
            objectMapper.writeValue(response.getWriter(), errorResponse);
            return;
        }

        Firestore db = FirestoreClient.getFirestore();
        String today = LocalDate.now().toString();
        String docId = studentId + "_" + today + "_" + subjectCode;

        Map<String, Object> attendanceData = new HashMap<>();
        attendanceData.put("studentId", studentId);
        attendanceData.put("subjectCode", subjectCode);
        attendanceData.put("status", status);
        attendanceData.put("location", location);
        attendanceData.put("date", today);
        attendanceData.put("timestamp", Timestamp.now());
        attendanceData.put("confidence", 0.95);
        attendanceData.put("studentReview", "confirmed");
        attendanceData.put("createdAt", Timestamp.now());

        ApiFuture<WriteResult> future = db.collection("attendance")
                .document(docId).set(attendanceData);
        
        future.get(); // Wait for completion

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("message", "Attendance marked successfully");
        responseData.put("data", attendanceData);

        System.out.println("✅ Attendance marked for student: " + studentId);
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private void handleReviewRequest(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        // For now, just return success - in a real app, this would create a review request
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("message", "Review request submitted successfully");

        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private String formatTime(Timestamp timestamp) {
        if (timestamp == null) return "-";
        try {
            java.util.Date date = timestamp.toDate();
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("HH:mm");
            return sdf.format(date);
        } catch (Exception e) {
            return "-";
        }
    }
}