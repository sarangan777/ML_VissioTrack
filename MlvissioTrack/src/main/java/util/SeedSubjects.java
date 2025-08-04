package util;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;

import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ExecutionException;

public class SeedSubjects {

    static Firestore db;

    public static void main(String[] args) {
        try {
            InputStream serviceAccount = SeedSubjects.class.getClassLoader().getResourceAsStream("serviceAccountKey.json");

            if (serviceAccount == null) {
                System.err.println("❌ serviceAccountKey.json not found.");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();
            FirebaseApp.initializeApp(options);

            db = FirestoreClient.getFirestore();

            // Seed both hierarchical and flat structures for compatibility
            seedHierarchicalSubjects();
            seedFlatSubjects();

            System.out.println("\n🎉 All subjects seeded successfully!");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void seedHierarchicalSubjects() throws ExecutionException, InterruptedException {
        System.out.println("📚 Seeding Hierarchical Subjects...");

        String department = "HNDIT";
        String semester = "4th Semester";

        String[][] subjects = {
                {"HNDIT401", "Data Structures and Algorithms", "4th Semester", "3", "LEC001"},
                {"HNDIT402", "Software Engineering Principles", "4th Semester", "3", "LEC002"},
                {"HNDIT403", "Mobile Application Development", "4th Semester", "3", "LEC003"},
                {"HNDIT404", "Database Management Systems", "4th Semester", "4", "LEC001"},
                {"HNDIT405", "Web Technologies", "4th Semester", "3", "LEC002"},
                {"HNDIT406", "Computer Networks", "4th Semester", "3", "LEC003"},
                {"HNDIT407", "Operating Systems", "4th Semester", "4", "LEC001"},
                {"HNDIT408", "Human Computer Interaction", "4th Semester", "2", "LEC002"}
        };

        for (String[] s : subjects) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("courseCode", s[0]);
            doc.put("courseName", s[1]);
            doc.put("semester", s[2]);
            doc.put("credits", Integer.parseInt(s[3]));
            doc.put("lecturerId", s[4]);
            doc.put("department", department);
            doc.put("isActive", true);
            doc.put("createdAt", Timestamp.now());

            DocumentReference ref = db.collection("courses")
                    .document(department)
                    .collection("semesters")
                    .document(semester)
                    .collection("subjects")
                    .document(s[0]);

            ref.set(doc).get();
            System.out.println("✅ Hierarchical Subject: " + s[1]);
        }
    }

    private static void seedFlatSubjects() throws ExecutionException, InterruptedException {
        System.out.println("📚 Seeding Flat Subjects...");

        String[][] subjects = {
                {"HNDIT401", "Data Structures and Algorithms", "4th Semester", "3", "LEC001", "HNDIT"},
                {"HNDIT402", "Software Engineering Principles", "4th Semester", "3", "LEC002", "HNDIT"},
                {"HNDIT403", "Mobile Application Development", "4th Semester", "3", "LEC003", "HNDIT"},
                {"HNDIT404", "Database Management Systems", "4th Semester", "4", "LEC001", "HNDIT"},
                {"HNDIT405", "Web Technologies", "4th Semester", "3", "LEC002", "HNDIT"},
                {"HNDIT406", "Computer Networks", "4th Semester", "3", "LEC003", "HNDIT"},
                {"HNDIT407", "Operating Systems", "4th Semester", "4", "LEC001", "HNDIT"},
                {"HNDIT408", "Human Computer Interaction", "4th Semester", "2", "LEC002", "HNDIT"},
                // Add subjects for other departments
                {"HNDA401", "Graphic Design Fundamentals", "4th Semester", "3", "LEC001", "HNDA"},
                {"HNDA402", "Digital Media Production", "4th Semester", "3", "LEC002", "HNDA"},
                {"HNDM401", "Marketing Strategies", "4th Semester", "3", "LEC001", "HNDM"},
                {"HNDM402", "Consumer Behavior", "4th Semester", "3", "LEC002", "HNDM"},
                {"HNDE401", "Electrical Circuits", "4th Semester", "4", "LEC001", "HNDE"},
                {"HNDE402", "Digital Electronics", "4th Semester", "3", "LEC002", "HNDE"}
        };

        for (String[] s : subjects) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("courseCode", s[0]);
            doc.put("courseName", s[1]);
            doc.put("semester", s[2]);
            doc.put("credits", Integer.parseInt(s[3]));
            doc.put("lecturerId", s[4]);
            doc.put("department", s[5]);
            doc.put("isActive", true);
            doc.put("createdAt", Timestamp.now());

            db.collection("subjects").document(s[0]).set(doc).get();
            System.out.println("✅ Flat Subject: " + s[1] + " (" + s[5] + ")");
        }
    }
}