// ✅ FIXED VERSION: UserManagementServlet.java
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
import org.mindrot.jbcrypt.BCrypt;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutionException;

@WebServlet(name = "UserManagementServlet", urlPatterns = {"/api/users/*"})
public class UserManagementServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private ObjectMapper objectMapper;

    @Override
    public void init() throws ServletException {
        System.out.println("✅ [UserManagementServlet] Initializing...");
        try {
            FirebaseInitializer.initialize();
            this.objectMapper = new ObjectMapper();
            System.out.println("✅ [UserManagementServlet] Firebase initialized successfully.");
        } catch (Exception e) {
            System.err.println("❌ [UserManagementServlet] Firebase init failed:");
            e.printStackTrace();
            throw new ServletException("Firebase initialization failed in UserManagementServlet", e);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        String pathInfo = request.getPathInfo();
        System.out.println("✅ [UserManagementServlet] GET request: " + pathInfo);

        try {
            Firestore db = FirestoreClient.getFirestore();
            if (pathInfo != null && pathInfo.equals("/list")) {
                handleListUsers(request, response, db);
            } else if (pathInfo != null && pathInfo.startsWith("/profile/")) {
                String userId = pathInfo.substring("/profile/".length());
                handleGetUserProfile(request, response, db, userId);
            } else {
                handleListUsers(request, response, db);
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch users: " + e.getMessage());
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

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        String pathInfo = request.getPathInfo();
        System.out.println("✅ [UserManagementServlet] POST request: " + pathInfo);

        try {
            if (pathInfo != null && pathInfo.equals("/create")) {
                handleCreateUser(request, response);
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Endpoint not found");
                objectMapper.writeValue(response.getWriter(), errorResponse);
            }
        } catch (Exception e) {
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
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        String pathInfo = request.getPathInfo();
        System.out.println("✅ [UserManagementServlet] PUT request: " + pathInfo);

        try {
            if (pathInfo != null && pathInfo.startsWith("/update/")) {
                String userId = pathInfo.substring("/update/".length());
                handleUpdateUser(request, response, userId);
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Endpoint not found");
                objectMapper.writeValue(response.getWriter(), errorResponse);
            }
        } catch (Exception e) {
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
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        String pathInfo = request.getPathInfo();
        System.out.println("✅ [UserManagementServlet] DELETE request: " + pathInfo);

        try {
            if (pathInfo != null && pathInfo.startsWith("/delete/")) {
                String userId = pathInfo.substring("/delete/".length());
                handleDeleteUser(request, response, userId);
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Endpoint not found");
                objectMapper.writeValue(response.getWriter(), errorResponse);
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to process request: " + e.getMessage());
            objectMapper.writeValue(response.getWriter(), errorResponse);
        }
    }

    // ======================== Handler Methods ===========================

    private void handleListUsers(HttpServletRequest request, HttpServletResponse response, Firestore db)
            throws IOException, ExecutionException, InterruptedException {
        String department = request.getParameter("department");
        String role = request.getParameter("role");

        Query query = db.collection("users");
        if (department != null && !department.isEmpty()) query = query.whereEqualTo("department", department);
        if (role != null && !role.isEmpty()) query = query.whereEqualTo("role", role);

        ApiFuture<QuerySnapshot> future = query.get();
        List<Map<String, Object>> users = new ArrayList<>();

        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            Map<String, Object> user = new HashMap<>();
            user.put("id", doc.getId());
            user.put("name", doc.getString("name"));
            user.put("email", doc.getString("email"));
            user.put("registrationNumber", doc.getString("registrationNumber"));
            user.put("department", doc.getString("department"));
            user.put("birthDate", doc.getString("birthDate"));
            user.put("year", doc.getString("year"));
            user.put("type", doc.getString("type"));
            user.put("adminLevel", doc.getString("adminLevel"));
            user.put("profilePicture", doc.getString("profilePicture"));
            user.put("role", doc.getString("role"));
            user.put("isActive", doc.getBoolean("isActive"));
            user.put("createdAt", doc.getTimestamp("createdAt"));
            users.add(user);
        }

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("data", users);
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private void handleGetUserProfile(HttpServletRequest request, HttpServletResponse response, Firestore db, String userId)
            throws IOException, ExecutionException, InterruptedException {
        
        // Try to get user by document ID first
        DocumentSnapshot document = db.collection("users").document(userId).get().get();
        
        // If not found by document ID, try to find by email (userId might be email)
        if (!document.exists()) {
            ApiFuture<QuerySnapshot> userQuery = db.collection("users")
                    .whereEqualTo("email", userId)
                    .get();
            List<QueryDocumentSnapshot> userDocs = userQuery.get().getDocuments();
            if (!userDocs.isEmpty()) {
                document = userDocs.get(0);
            }
        }
        
        if (!document.exists()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            Map<String, Object> error = Map.of("success", false, "message", "User not found");
            objectMapper.writeValue(response.getWriter(), error);
            return;
        }

        Map<String, Object> user = new HashMap<>(document.getData());
        user.put("id", document.getId());
        
        // Ensure all profile fields are included
        if (!user.containsKey("birthDate")) user.put("birthDate", null);
        if (!user.containsKey("profilePicture")) user.put("profilePicture", null);
        if (!user.containsKey("year")) user.put("year", null);
        if (!user.containsKey("type")) user.put("type", null);
        if (!user.containsKey("adminLevel")) user.put("adminLevel", null);
        
        Map<String, Object> responseData = Map.of("success", true, "data", user);
        objectMapper.writeValue(response.getWriter(), responseData);
    }

    private void handleCreateUser(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ExecutionException, InterruptedException {

        Map<String, Object> requestBody = objectMapper.readValue(request.getReader(), Map.class);
        String email = (String) requestBody.get("email");

        Firestore db = FirestoreClient.getFirestore();
        boolean userExists = !db.collection("users").whereEqualTo("email", email).get().get().isEmpty();

        if (userExists) {
            response.setStatus(HttpServletResponse.SC_CONFLICT);
            objectMapper.writeValue(response.getWriter(), Map.of("success", false, "message", "User with this email already exists"));
            return;
        }

        requestBody.put("password", BCrypt.hashpw((String) requestBody.get("password"), BCrypt.gensalt(12)));
        requestBody.put("department", requestBody.getOrDefault("department", "HNDIT"));
        requestBody.put("role", requestBody.getOrDefault("role", "student"));
        requestBody.put("isActive", requestBody.getOrDefault("isActive", true));
        requestBody.put("createdAt", Timestamp.now());

        db.collection("users").add(requestBody);
        objectMapper.writeValue(response.getWriter(), Map.of("success", true, "message", "User created successfully", "data", requestBody));
    }

    private void handleUpdateUser(HttpServletRequest request, HttpServletResponse response, String userId)
            throws IOException, ExecutionException, InterruptedException {

        Map<String, Object> requestBody = objectMapper.readValue(request.getReader(), Map.class);
        if (requestBody.containsKey("password")) {
            requestBody.put("password", BCrypt.hashpw((String) requestBody.get("password"), BCrypt.gensalt(12)));
        }
        requestBody.put("updatedAt", Timestamp.now());

        Firestore db = FirestoreClient.getFirestore();
        db.collection("users").document(userId).update(requestBody).get();

        objectMapper.writeValue(response.getWriter(), Map.of("success", true, "message", "User updated successfully", "data", requestBody));
    }

    private void handleDeleteUser(HttpServletRequest request, HttpServletResponse response, String userId)
            throws IOException, ExecutionException, InterruptedException {

        Map<String, Object> updates = Map.of("isActive", false, "deletedAt", Timestamp.now());
        FirestoreClient.getFirestore().collection("users").document(userId).update(updates).get();

        objectMapper.writeValue(response.getWriter(), Map.of("success", true, "message", "User deleted successfully"));
    }
}
