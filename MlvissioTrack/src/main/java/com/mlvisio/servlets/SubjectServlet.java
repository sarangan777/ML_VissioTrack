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
        System.out.println("✅ [SubjectServlet] Full request URL: " + request.getRequestURL() + "?" + request.getQueryString());
        
        try {
            Firestore db = FirestoreClient.getFirestore();
            
            if (db == null) {
                System.err.println("❌ [SubjectServlet] Firestore is null!");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Database connection failed");
                objectMapper.writeValue(response.getWriter(), errorResponse);
                return;
            }
            
            // Get subjects from hierarchical structure
            List<Map<String, Object>> subjects = new ArrayList<>();
            
            if (department != null && !department.isEmpty()) {
                // Get subjects for specific department
                System.out.println("🔍 [SubjectServlet] Fetching subjects for department: " + department);
                subjects.addAll(getSubjectsForDepartment(db, department));
            } else {
                // Get subjects for all departments
                System.out.println("🔍 [SubjectServlet] Fetching subjects for all departments");
                String[] departments = {"HNDIT", "HNDA", "HNDM", "HNDE"};
                for (String dept : departments) {
                    subjects.addAll(getSubjectsForDepartment(db, dept));
                }
            }
            
            System.out.println("📊 [SubjectServlet] Total subjects found: " + subjects.size());
            
            // If no subjects found in hierarchical structure, try flat structure as fallback
            if (subjects.isEmpty()) {
                System.out.println("⚠️ [SubjectServlet] No subjects found in hierarchical structure, trying flat structure...");
                subjects.addAll(getSubjectsFromFlatStructure(db, department));
            }
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("data", subjects);
            responseData.put("count", subjects.size());
            responseData.put("department", department);
            
            System.out.println("✅ [SubjectServlet] Returning " + subjects.size() + " subjects");
            System.out.println("📤 [SubjectServlet] Response data: " + responseData);
            objectMapper.writeValue(response.getWriter(), responseData);
            
        } catch (Exception e) {
            System.err.println("❌ [SubjectServlet] Error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch subjects: " + e.getMessage());
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("department", department);
            objectMapper.writeValue(response.getWriter(), errorResponse);
        }
    }

    private List<Map<String, Object>> getSubjectsForDepartment(Firestore db, String department) {
        List<Map<String, Object>> subjects = new ArrayList<>();
        
        try {
            System.out.println("🔍 [SubjectServlet] Starting hierarchical fetch for department: " + department);
            
            // Navigate through the hierarchical structure: courses/{department}/semesters/{semester}/subjects
            ApiFuture<QuerySnapshot> semestersFuture = db.collection("courses")
                    .document(department)
                    .collection("semesters")
                    .get();
            
            List<QueryDocumentSnapshot> semesters = semestersFuture.get().getDocuments();
            System.out.println("📚 [SubjectServlet] Found " + semesters.size() + " semesters for department: " + department);
            
            if (semesters.isEmpty()) {
                System.out.println("⚠️ [SubjectServlet] No semesters found for department: " + department);
                return subjects;
            }
            
            for (QueryDocumentSnapshot semesterDoc : semesters) {
                String semesterName = semesterDoc.getId();
                System.out.println("📚 [SubjectServlet] Processing semester: " + semesterName);
                
                try {
                    ApiFuture<QuerySnapshot> subjectsFuture = db.collection("courses")
                            .document(department)
                            .collection("semesters")
                            .document(semesterName)
                            .collection("subjects")
                            .get();
                    
                    List<QueryDocumentSnapshot> subjectDocs = subjectsFuture.get().getDocuments();
                    System.out.println("📚 [SubjectServlet] Found " + subjectDocs.size() + " subjects in semester: " + semesterName);
                    
                    for (QueryDocumentSnapshot subjectDoc : subjectDocs) {
                        try {
                            Map<String, Object> subject = new HashMap<>();
                            subject.put("id", subjectDoc.getId());
                            subject.put("courseCode", subjectDoc.getString("courseCode"));
                            subject.put("courseName", subjectDoc.getString("courseName"));
                            subject.put("semester", semesterName);
                            subject.put("credits", subjectDoc.getLong("credits"));
                            subject.put("department", department);
                            subject.put("isActive", subjectDoc.getBoolean("isActive"));
                            
                            // Get lecturer information
                            String lecturerId = subjectDoc.getString("lecturerId");
                            subject.put("lecturerId", lecturerId);
                            
                            if (lecturerId != null && !lecturerId.isEmpty()) {
                                try {
                                    ApiFuture<DocumentSnapshot> lecturerFuture = db.collection("lecturers")
                                            .document(lecturerId).get();
                                    DocumentSnapshot lecturerDoc = lecturerFuture.get();
                                    if (lecturerDoc.exists()) {
                                        subject.put("lecturerName", lecturerDoc.getString("name"));
                                        subject.put("lecturerEmail", lecturerDoc.getString("email"));
                                        System.out.println("📚 [SubjectServlet] Subject: " + subjectDoc.getString("courseCode") + " - Lecturer: " + lecturerDoc.getString("name"));
                                    } else {
                                        subject.put("lecturerName", "Unknown Lecturer");
                                        System.out.println("⚠️ [SubjectServlet] Lecturer not found for ID: " + lecturerId);
                                    }
                                } catch (Exception lecturerError) {
                                    System.err.println("❌ [SubjectServlet] Error fetching lecturer info for " + lecturerId + ": " + lecturerError.getMessage());
                                    subject.put("lecturerName", "Unknown Lecturer");
                                }
                            } else {
                                subject.put("lecturerName", "No Lecturer Assigned");
                            }
                            
                            subjects.add(subject);
                            System.out.println("✅ [SubjectServlet] Added subject: " + subject.get("courseCode"));
                            
                        } catch (Exception subjectError) {
                            System.err.println("❌ [SubjectServlet] Error processing subject " + subjectDoc.getId() + ": " + subjectError.getMessage());
                        }
                    }
                } catch (Exception semesterError) {
                    System.err.println("❌ [SubjectServlet] Error fetching subjects for semester " + semesterName + ": " + semesterError.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("❌ [SubjectServlet] Error fetching subjects for department " + department + ": " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("📊 [SubjectServlet] Total subjects found for " + department + ": " + subjects.size());
        return subjects;
    }

    private List<Map<String, Object>> getSubjectsFromFlatStructure(Firestore db, String department) {
        List<Map<String, Object>> subjects = new ArrayList<>();
        
        try {
            System.out.println("🔍 [SubjectServlet] Trying flat structure for department: " + department);
            
            Query query = db.collection("subjects");
            if (department != null && !department.isEmpty()) {
                query = query.whereEqualTo("department", department);
            }
            
            ApiFuture<QuerySnapshot> future = query.get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            
            System.out.println("📚 [SubjectServlet] Found " + documents.size() + " subjects in flat structure");
            
            for (QueryDocumentSnapshot doc : documents) {
                try {
                    Map<String, Object> subject = new HashMap<>();
                    subject.put("id", doc.getId());
                    subject.put("courseCode", doc.getString("courseCode"));
                    subject.put("courseName", doc.getString("courseName"));
                    subject.put("semester", doc.getString("semester"));
                    subject.put("credits", doc.getLong("credits"));
                    subject.put("department", doc.getString("department"));
                    subject.put("isActive", doc.getBoolean("isActive"));
                    
                    // Get lecturer information
                    String lecturerId = doc.getString("lecturerId");
                    subject.put("lecturerId", lecturerId);
                    
                    if (lecturerId != null && !lecturerId.isEmpty()) {
                        try {
                            ApiFuture<DocumentSnapshot> lecturerFuture = db.collection("lecturers")
                                    .document(lecturerId).get();
                            DocumentSnapshot lecturerDoc = lecturerFuture.get();
                            if (lecturerDoc.exists()) {
                                subject.put("lecturerName", lecturerDoc.getString("name"));
                                subject.put("lecturerEmail", lecturerDoc.getString("email"));
                            } else {
                                subject.put("lecturerName", "Unknown Lecturer");
                            }
                        } catch (Exception lecturerError) {
                            subject.put("lecturerName", "Unknown Lecturer");
                        }
                    } else {
                        subject.put("lecturerName", "No Lecturer Assigned");
                    }
                    
                    subjects.add(subject);
                    
                } catch (Exception subjectError) {
                    System.err.println("❌ [SubjectServlet] Error processing flat subject " + doc.getId() + ": " + subjectError.getMessage());
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ [SubjectServlet] Error fetching subjects from flat structure: " + e.getMessage());
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