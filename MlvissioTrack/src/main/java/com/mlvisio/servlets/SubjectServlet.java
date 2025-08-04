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

@WebServlet(name = "SubjectServlet", urlPatterns = {"/api/subjects"})
public class SubjectServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private ObjectMapper objectMapper;

    @Override
    public void init() throws ServletException {
        System.out.println("✅ [SubjectServlet] Initializing...");
        try {
            FirebaseInitializer.initialize();
            this.objectMapper = new ObjectMapper();
            System.out.println("✅ [SubjectServlet] Firebase initialized successfully.");
        } catch (Exception e) {
            System.err.println("❌ [SubjectServlet] Firebase init failed:");
            e.printStackTrace();
            throw new ServletException("Firebase initialization failed in SubjectServlet", e);
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

        String department = request.getParameter("department");
        System.out.println("✅ [SubjectServlet] GET request for subjects, department: " + department);
        
        try {
            Firestore db = FirestoreClient.getFirestore();
            
            // Get subjects from hierarchical structure
            List<Map<String, Object>> subjects = new ArrayList<>();
            
            if (department != null && !department.isEmpty()) {
                // Get subjects for specific department
                subjects.addAll(getSubjectsForDepartment(db, department));
            } else {
                // Get subjects for all departments
                String[] departments = {"HNDIT", "HNDA", "HNDM", "HNDE"};
                for (String dept : departments) {
                    subjects.addAll(getSubjectsForDepartment(db, dept));
                }
            }
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("data", subjects);
            
            System.out.println("✅ Found " + subjects.size() + " subjects");
            objectMapper.writeValue(response.getWriter(), responseData);
            
        } catch (Exception e) {
            System.err.println("❌ [SubjectServlet] Error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch subjects: " + e.getMessage());
            objectMapper.writeValue(response.getWriter(), errorResponse);
        }
    }

    private List<Map<String, Object>> getSubjectsForDepartment(Firestore db, String department) 
            throws ExecutionException, InterruptedException {
        
        List<Map<String, Object>> subjects = new ArrayList<>();
        
        try {
            // Navigate through the hierarchical structure: courses/{department}/semesters/{semester}/subjects
            ApiFuture<QuerySnapshot> semestersFuture = db.collection("courses")
                    .document(department)
                    .collection("semesters")
                    .get();
            
            List<QueryDocumentSnapshot> semesters = semestersFuture.get().getDocuments();
            System.out.println("📚 Found " + semesters.size() + " semesters for department: " + department);
            
            for (QueryDocumentSnapshot semesterDoc : semesters) {
                String semesterName = semesterDoc.getId();
                System.out.println("📚 Processing semester: " + semesterName);
                
                ApiFuture<QuerySnapshot> subjectsFuture = db.collection("courses")
                        .document(department)
                        .collection("semesters")
                        .document(semesterName)
                        .collection("subjects")
                        .get();
                
                List<QueryDocumentSnapshot> subjectDocs = subjectsFuture.get().getDocuments();
                System.out.println("📚 Found " + subjectDocs.size() + " subjects in semester: " + semesterName);
                
                for (QueryDocumentSnapshot subjectDoc : subjectDocs) {
                    Map<String, Object> subject = new HashMap<>();
                    subject.put("id", subjectDoc.getId());
                    subject.put("courseCode", subjectDoc.getString("courseCode"));
                    subject.put("courseName", subjectDoc.getString("courseName"));
                    subject.put("semester", subjectDoc.getString("semester"));
                    subject.put("credits", subjectDoc.getLong("credits"));
                    subject.put("department", department);
                    subject.put("isActive", subjectDoc.getBoolean("isActive"));
                    
                    // Get lecturer information
                    String lecturerId = subjectDoc.getString("lecturerId");
                    subject.put("lecturerId", lecturerId);
                    
                    if (lecturerId != null) {
                        try {
                            ApiFuture<DocumentSnapshot> lecturerFuture = db.collection("lecturers")
                                    .document(lecturerId).get();
                            DocumentSnapshot lecturerDoc = lecturerFuture.get();
                            if (lecturerDoc.exists()) {
                                subject.put("lecturerName", lecturerDoc.getString("name"));
                                subject.put("lecturerEmail", lecturerDoc.getString("email"));
                                System.out.println("📚 Subject: " + subjectDoc.getString("courseCode") + " - Lecturer: " + lecturerDoc.getString("name"));
                            } else {
                                subject.put("lecturerName", "Unknown Lecturer");
                                System.out.println("⚠️ Lecturer not found for ID: " + lecturerId);
                            }
                        } catch (Exception e) {
                            System.err.println("Error fetching lecturer info: " + e.getMessage());
                            subject.put("lecturerName", "Unknown Lecturer");
                        }
                    } else {
                        subject.put("lecturerName", "No Lecturer Assigned");
                    }
                    
                    subjects.add(subject);
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error fetching subjects for department " + department + ": " + e.getMessage());
            e.printStackTrace();
        }
        
        return subjects;
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