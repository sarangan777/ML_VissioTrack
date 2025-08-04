package com.mlvisio.servlets;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.mlvisio.util.FirebaseInitializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import jakarta.servlet.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ExecutionException;

@WebServlet(name = "DashboardStatsServlet", urlPatterns = {"/api/stats/dashboard"})
public class DashboardStatsServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private ObjectMapper objectMapper;

    @Override
    public void init() throws ServletException {
        System.out.println("✅ [DashboardStatsServlet] Initializing...");
        try {
            FirebaseInitializer.initialize();
            this.objectMapper = new ObjectMapper();
            System.out.println("✅ [DashboardStatsServlet] Firebase initialized successfully.");
        } catch (Exception e) {
            System.err.println("❌ [DashboardStatsServlet] Firebase init failed:");
            e.printStackTrace();
            throw new ServletException("Firebase initialization failed in DashboardStatsServlet", e);
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        
        // Add CORS headers
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        System.out.println("✅ [DashboardStatsServlet] Processing dashboard stats request...");

        Map<String, Object> responseData = new HashMap<>();
        
        try {
            Firestore db = FirestoreClient.getFirestore();
            if (db == null) {
                System.err.println("❌ [DashboardStatsServlet] Firestore is null!");
                throw new RuntimeException("Firestore not initialized");
            }
            
            Map<String, Object> data = new HashMap<>();
            
            // Get total students
            ApiFuture<QuerySnapshot> userQuery = db.collection("users")
                    .whereEqualTo("role", "student")
                    .whereEqualTo("isActive", true)
                    .get();
            List<QueryDocumentSnapshot> users = userQuery.get().getDocuments();
            int totalStudents = users.size();
            data.put("totalStudents", totalStudents);
            System.out.println("📊 Total active students: " + totalStudents);

            // Get today's attendance
            String today = LocalDate.now().toString();
            System.out.println("📅 Checking attendance for date: " + today);
            ApiFuture<QuerySnapshot> attendanceQuery = db.collection("attendance")
                    .whereEqualTo("date", today)
                    .get();
            List<QueryDocumentSnapshot> attendanceToday = attendanceQuery.get().getDocuments();
            
            // Count unique present students (avoid duplicates from multiple subjects)
            Set<String> uniquePresentStudents = new HashSet<>();
            Set<String> uniqueAbsentStudents = new HashSet<>();
            int presentToday = 0;
            int absentToday = 0;
            
            for (QueryDocumentSnapshot doc : attendanceToday) {
                String status = doc.getString("status");
                String registrationNumber = doc.getString("registrationNumber");
                if ("Present".equals(status) && registrationNumber != null && !uniquePresentStudents.contains(registrationNumber)) {
                    uniquePresentStudents.add(registrationNumber);
                    presentToday++;
                } else if ("Absent".equals(status) && registrationNumber != null && !uniqueAbsentStudents.contains(registrationNumber)) {
                    uniqueAbsentStudents.add(registrationNumber);
                    absentToday++;
                }
            }
            
            data.put("presentToday", presentToday);
            data.put("absentToday", absentToday);
            System.out.println("📊 Present today: " + presentToday);
            System.out.println("📊 Absent today: " + absentToday);

            // Calculate attendance rate
            double rate = totalStudents > 0 ? ((double) presentToday / totalStudents) * 100 : 0;
            data.put("attendanceRate", (int) Math.round(rate));
            System.out.println("📊 Attendance rate: " + (int) Math.round(rate) + "%");

            // Get total courses/subjects
            // Count subjects from hierarchical structure
            int totalCourses = 0;
            String[] departments = {"HNDIT", "HNDA", "HNDM", "HNDE"};
            
            for (String dept : departments) {
                try {
                    ApiFuture<QuerySnapshot> semestersFuture = db.collection("courses")
                            .document(dept)
                            .collection("semesters")
                            .get();
                    
                    List<QueryDocumentSnapshot> semesters = semestersFuture.get().getDocuments();
                    
                    for (QueryDocumentSnapshot semesterDoc : semesters) {
                        String semesterName = semesterDoc.getId();
                        
                        ApiFuture<QuerySnapshot> subjectsFuture = db.collection("courses")
                                .document(dept)
                                .collection("semesters")
                                .document(semesterName)
                                .collection("subjects")
                                .get();
                        
                        List<QueryDocumentSnapshot> subjectDocs = subjectsFuture.get().getDocuments();
                        totalCourses += subjectDocs.size();
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ Error counting subjects for department " + dept + ": " + e.getMessage());
                }
            }
            
            data.put("totalCourses", totalCourses);
            System.out.println("📊 Total courses: " + totalCourses);

            // Department-wise attendance
            Map<String, Integer> deptTotals = new HashMap<>();
            Map<String, Integer> deptPresent = new HashMap<>();
            
            for (QueryDocumentSnapshot user : users) {
                String dept = user.getString("department");
                if (dept != null) {
                    deptTotals.put(dept, deptTotals.getOrDefault(dept, 0) + 1);
                }
            }

            // Get department-wise present count
            for (QueryDocumentSnapshot att : attendanceToday) {
                String registrationNumber = att.getString("registrationNumber");
                String status = att.getString("status");
                if (registrationNumber != null && "Present".equals(status)) {
                    // Find student's department
                    try {
                        ApiFuture<QuerySnapshot> studentQuery = db.collection("users")
                                .whereEqualTo("registrationNumber", registrationNumber)
                                .get();
                        List<QueryDocumentSnapshot> studentDocs = studentQuery.get().getDocuments();
                        if (!studentDocs.isEmpty()) {
                            DocumentSnapshot student = studentDocs.get(0);
                            String dept = student.getString("department");
                            if (dept != null) {
                                deptPresent.put(dept, deptPresent.getOrDefault(dept, 0) + 1);
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ Error fetching student department: " + e.getMessage());
                    }
                }
            }

            List<Map<String, Object>> departmentAttendance = new ArrayList<>();
            for (String dept : deptTotals.keySet()) {
                int present = deptPresent.getOrDefault(dept, 0);
                int total = deptTotals.get(dept);
                int deptRate = total == 0 ? 0 : (int) Math.round(((double) present / total) * 100);
                
                Map<String, Object> deptData = new HashMap<>();
                deptData.put("department", dept);
                deptData.put("rate", deptRate);
                departmentAttendance.add(deptData);
            }
            data.put("departmentAttendance", departmentAttendance);

            // Study mode counts
            int fullTime = 0, partTime = 0;
            for (QueryDocumentSnapshot user : users) {
                String type = user.getString("type");
                if ("Full Time".equalsIgnoreCase(type)) {
                    fullTime++;
                } else if ("Part Time".equalsIgnoreCase(type)) {
                    partTime++;
                } else {
                    // Default to full time if not specified
                    fullTime++;
                }
            }
            
            Map<String, Integer> studyModeCounts = new HashMap<>();
            studyModeCounts.put("fullTime", fullTime);
            studyModeCounts.put("partTime", partTime);
            data.put("studyModeCounts", studyModeCounts);

            responseData.put("success", true);
            responseData.put("data", data);
            
            System.out.println("✅ [DashboardStatsServlet] Stats generated successfully");
            System.out.println("📤 [DashboardStatsServlet] Sending response: " + responseData);

        } catch (InterruptedException | ExecutionException e) {
            System.err.println("❌ [DashboardStatsServlet] Error: " + e.getMessage());
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            responseData.put("success", false);
            responseData.put("message", "Failed to fetch dashboard stats: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ [DashboardStatsServlet] Unexpected error: " + e.getMessage());
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            responseData.put("success", false);
            responseData.put("message", "Unexpected error: " + e.getMessage());
        }

        objectMapper.writeValue(resp.getWriter(), responseData);
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setStatus(HttpServletResponse.SC_OK);
    }
}