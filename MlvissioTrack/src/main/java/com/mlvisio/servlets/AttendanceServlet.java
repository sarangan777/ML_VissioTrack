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
        System.out.println("📊 [AttendanceServlet] Fetching attendance for student: " + studentEmail);
        
        if (studentEmail == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Student email is required");
            objectMapper.writeValue(response.getWriter(), errorResponse);
            return;
        }

        try {
            // Get student info first to get registration number
            ApiFuture<QuerySnapshot> userQuery = db.collection("users")
                    .whereEqualTo("email", studentEmail)
                    .get();
            
            List<QueryDocumentSnapshot> userDocs = userQuery.get().getDocuments();
            if (userDocs.isEmpty()) {
                System.out.println("❌ [AttendanceServlet] Student not found: " + studentEmail);
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Student not found");
                objectMapper.writeValue(response.getWriter(), errorResponse);
                return;
            }

            String registrationNumber = userDocs.get(0).getString("registrationNumber");
            System.out.println("📊 [AttendanceServlet] Found student with registration number: " + registrationNumber);
            
            // Get attendance records using registration number (as per seeded data)
            Query attendanceQuery = db.collection("attendance")
                    .whereEqualTo("registrationNumber", registrationNumber);
            
            // Add date filters if provided
            if (startDate != null && !startDate.isEmpty()) {
                attendanceQuery = attendanceQuery.whereGreaterThanOrEqualTo("date", startDate);
            }
            if (endDate != null && !endDate.isEmpty()) {
                attendanceQuery = attendanceQuery.whereLessThanOrEqualTo("date", endDate);
            }
            
            // Order by date descending
            attendanceQuery = attendanceQuery.orderBy("date", Query.Direction.DESCENDING);
            
            ApiFuture<QuerySnapshot> future = attendanceQuery.get();
            List<QueryDocumentSnapshot> attendanceDocs = future.get().getDocuments();
            List<Map<String, Object>> attendanceRecords = new ArrayList<>();
            
            System.out.println("📊 [AttendanceServlet] Found " + attendanceDocs.size() + " attendance records");
            
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
            
            System.out.println("✅ [AttendanceServlet] Returning " + attendanceRecords.size() + " attendance records");
            objectMapper.writeValue(response.getWriter(), responseData);
            
        } catch (Exception e) {
            System.err.println("❌ [AttendanceServlet] Error in handleStudentAttendance: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch attendance data: " + e.getMessage());
            objectMapper.writeValue(response.getWriter(), errorResponse);
        }
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

        // Get student info first to get registration number
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

        String registrationNumber = userDocs.get(0).getString("registrationNumber");
        
        // Get attendance records for this student, ordered by date descending
        ApiFuture<QuerySnapshot> attendanceQuery = db.collection("attendance")
                .whereEqualTo("registrationNumber", registrationNumber)
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
        
        System.out.println("📊 [AttendanceServlet] Generating attendance report - Email: " + studentEmail + ", Department: " + department);
        
        try {
            Query query = db.collection("attendance");
            
            // If specific student email is provided, filter by registration number
            if (studentEmail != null && !studentEmail.isEmpty()) {
                // Get student registration number from email
                ApiFuture<QuerySnapshot> userQuery = db.collection("users")
                        .whereEqualTo("email", studentEmail)
                        .get();
                
                List<QueryDocumentSnapshot> userDocs = userQuery.get().getDocuments();
                if (!userDocs.isEmpty()) {
                    String registrationNumber = userDocs.get(0).getString("registrationNumber");
                    query = query.whereEqualTo("registrationNumber", registrationNumber);
                    System.out.println("📊 [AttendanceServlet] Filtering by registration number: " + registrationNumber);
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
            
            System.out.println("📊 [AttendanceServlet] Processing " + documents.size() + " attendance records");
            
            for (QueryDocumentSnapshot doc : documents) {
                String registrationNumber = doc.getString("registrationNumber");
                
                // Get student details using registration number
                Map<String, Object> studentInfo = new HashMap<>();
                try {
                    ApiFuture<QuerySnapshot> studentQuery = db.collection("users")
                            .whereEqualTo("registrationNumber", registrationNumber)
                            .get();
                    List<QueryDocumentSnapshot> studentDocs = studentQuery.get().getDocuments();
                    
                    if (!studentDocs.isEmpty()) {
                        DocumentSnapshot student = studentDocs.get(0);
                        studentInfo.put("name", student.getString("name"));
                        studentInfo.put("email", student.getString("email"));
                        studentInfo.put("registrationNumber", student.getString("registrationNumber"));
                        studentInfo.put("department", student.getString("department"));
                        
                        // Filter by department if specified
                        if (department != null && !department.isEmpty()) {
                            String studentDept = student.getString("department");
                            if (!department.equals(studentDept)) {
                                continue; // Skip this record
                            }
                        }
                    } else {
                        studentInfo.put("name", "Unknown Student");
                        studentInfo.put("email", "unknown@example.com");
                        studentInfo.put("registrationNumber", registrationNumber);
                        studentInfo.put("department", "Unknown");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ [AttendanceServlet] Error fetching student info for " + registrationNumber + ": " + e.getMessage());
                    studentInfo.put("name", "Unknown Student");
                    studentInfo.put("email", "unknown@example.com");
                    studentInfo.put("registrationNumber", registrationNumber);
                    studentInfo.put("department", "Unknown");
                }
                
                Map<String, Object> record = new HashMap<>();
                record.put("id", doc.getId());
                record.put("registrationNumber", registrationNumber);
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
            
            System.out.println("✅ [AttendanceServlet] Returning " + attendanceRecords.size() + " attendance records");
            objectMapper.writeValue(response.getWriter(), responseData);
            
        } catch (Exception e) {
            System.err.println("❌ [AttendanceServlet] Error in handleAttendanceReport: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch attendance report: " + e.getMessage());
            objectMapper.writeValue(response.getWriter(), errorResponse);
        }
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
            record.put("registrationNumber", doc.getString("registrationNumber"));
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
        String registrationNumber = (String) jsonRequest.get("registrationNumber");
        String subjectCode = (String) jsonRequest.get("subjectCode");
        String status = jsonRequest.get("status") != null ? (String) jsonRequest.get("status") : "Present";
        String location = jsonRequest.get("location") != null ? (String) jsonRequest.get("location") : "Unknown";

        if (registrationNumber == null || registrationNumber.isEmpty() || subjectCode == null || subjectCode.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Registration number and subject code are required");
            objectMapper.writeValue(response.getWriter(), errorResponse);
            return;
        }

        Firestore db = FirestoreClient.getFirestore();
        String today = LocalDate.now().toString();
        String docId = registrationNumber.replaceAll("[^a-zA-Z0-9_\\-]", "_") + "_" + today + "_" + subjectCode;

        Map<String, Object> attendanceData = new HashMap<>();
        attendanceData.put("registrationNumber", registrationNumber);
        attendanceData.put("vertexLabel", registrationNumber);
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

        System.out.println("✅ Attendance marked for student: " + registrationNumber);
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