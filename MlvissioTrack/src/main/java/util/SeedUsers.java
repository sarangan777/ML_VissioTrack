// SeedUsers.java
package util;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.mindrot.jbcrypt.BCrypt;

import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ExecutionException;

public class SeedUsers {

    static Firestore db;

    public static void main(String[] args) {
        try {
            InputStream serviceAccount = SeedUsers.class.getClassLoader().getResourceAsStream("serviceAccountKey.json");

            if (serviceAccount == null) {
                System.err.println("❌ serviceAccountKey.json not found.");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();
            FirebaseApp.initializeApp(options);

            db = FirestoreClient.getFirestore();

            Map<String, String> lecturers = seedLecturers();
            Map<String, String> users = seedUsers();
            seedCoursesHierarchical(lecturers);
            seedSchedules(lecturers);
            Map<String, String> devices = seedDevices();
            seedAttendance(users, devices);
            seedAttendanceGoal();

            System.out.println("\n🎉 All data seeded successfully!");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static Map<String, String> seedLecturers() throws ExecutionException, InterruptedException {
        System.out.println("👨‍🏫 Seeding Lecturers...");
        Map<String, String> lecturerMap = new HashMap<>();

        String[][] lecturers = {
                {"LEC001", "Sri.Sethuparan", "rajesh.kumar@college.edu"},
                {"LEC002", "Prof. Priya Jayawardena", "priya.jayawardena@college.edu"},
                {"LEC003", "Mr. Sunil Bandara", "sunil.bandara@college.edu"}
        };

        for (String[] l : lecturers) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("lecturerId", l[0]);
            doc.put("name", l[1]);
            doc.put("email", l[2]);
            doc.put("department", "HNDIT");
            doc.put("createdAt", Timestamp.now());

            db.collection("lecturers").document(l[0]).set(doc).get();
            lecturerMap.put(l[1], l[0]);
            System.out.println("✅ Lecturer: " + l[1]);
        }

        return lecturerMap;
    }

    private static Map<String, String> seedUsers() throws ExecutionException, InterruptedException {
        System.out.println("👥 Seeding Users...");
        Map<String, String> userMap = new HashMap<>();

        String[][] students = {
                {"T.Sarankan", "HNDIT/PT/2024/001", "sarangan@mlvisio.com", "2002-05-15", "2nd Year", "Full Time"},
                {"P.Nallamuthan", "HNDIT/PT/2024/002", "nallamuthan@mlvisio.com", "2002-04-10", "2nd Year", "Part Time"},
                {"K.Jeyanthan", "HNDIT/PT/2024/003", "jeyan@mlvisio.com", "2002-03-20", "2nd Year", "Full Time"},
                {"S.Thenujan", "HNDIT/PT/2024/004", "thenujan@mlvisio.com", "2002-06-12", "2nd Year", "Full Time"},
                {"M.Megaruban", "HNDIT/PT/2024/005", "rooban@mlvisio.com", "2002-02-25", "2nd Year", "Full Time"},
                {"S.Gajan", "HNDIT/PT/2024/006", "gajan@mlvisio.com", "2002-07-18", "2nd Year", "Part Time"},
                {"A.Priya", "HNDIT/PT/2024/007", "priya@mlvisio.com", "2002-08-22", "2nd Year", "Full Time"}
        };

        String[][] admins = {
                {"Admin One", "HNDIT-ADM-001", "admin1@mlvisio.com", "super"}
        };

        for (String[] s : students) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("name", s[0]);
            doc.put("registrationNumber", s[1]);
            doc.put("email", s[2]);
            doc.put("birthDate", s[3]);
            doc.put("year", s[4]);
            doc.put("type", s[5]);
            doc.put("department", "HNDIT");
            doc.put("role", "student");
            doc.put("vertexLabel", s[1]);
            doc.put("password", BCrypt.hashpw(s[1], BCrypt.gensalt(12)));
            doc.put("isActive", true);
            doc.put("createdAt", Timestamp.now());

            db.collection("users").document(s[2]).set(doc).get();
            userMap.put(s[2], s[1]);
            System.out.println("✅ Student: " + s[0]);
        }

        for (String[] a : admins) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("name", a[0]);
            doc.put("registrationNumber", a[1]);
            doc.put("email", a[2]);
            doc.put("adminLevel", a[3]);
            doc.put("department", "HNDIT");
            doc.put("role", "admin");
            doc.put("password", BCrypt.hashpw(a[1], BCrypt.gensalt(12)));
            doc.put("isActive", true);
            doc.put("createdAt", Timestamp.now());

            db.collection("users").document(a[2]).set(doc).get();
            userMap.put(a[2], a[1]);
            System.out.println("✅ Admin: " + a[0]);
        }

        return userMap;
    }

    private static void seedCoursesHierarchical(Map<String, String> lecturers) throws ExecutionException, InterruptedException {
        System.out.println("📚 Seeding Courses (Hierarchical)...");

        String department = "HNDIT";
        String semester = "4th Semester";

        String[][] subjects = {
                {"HNDIT401", "Data Structures", "4th Semester", "3", "LEC001"},
                {"HNDIT402", "Software Engineering", "4th Semester", "3", "LEC002"},
                {"HNDIT403", "Mobile Application Development", "4th Semester", "3", "LEC003"}
        };

        for (String[] s : subjects) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("courseCode", s[0]);
            doc.put("courseName", s[1]);
            doc.put("semester", s[2]);
            doc.put("credits", Integer.parseInt(s[3]));
            doc.put("lecturerId", s[4]);
            doc.put("isActive", true);
            doc.put("createdAt", Timestamp.now());

            DocumentReference ref = db.collection("courses")
                    .document(department)
                    .collection("semesters")
                    .document(semester)
                    .collection("subjects")
                    .document(s[0]);

            ref.set(doc).get();
            System.out.println("✅ Subject: " + s[1]);
        }
    }

    private static void seedSchedules(Map<String, String> lecturers) throws ExecutionException, InterruptedException {
        System.out.println("📅 Seeding Schedules...");

        Object[][] schedules = {
                {"HNDIT401", "Monday", "09:00", "11:00", "Lab 01", "2nd Year", "Sri.Sethuparan"},
                {"HNDIT402", "Tuesday", "11:00", "13:00", "Lab 02", "2nd Year", "Prof. Priya Jayawardena"},
                {"HNDIT403", "Wednesday", "14:00", "16:00", "Lab 03", "2nd Year", "Mr. Sunil Bandara"}
        };

        for (Object[] s : schedules) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("subjectCode", s[0]);
            doc.put("dayOfWeek", s[1]);
            doc.put("startTime", s[2]);
            doc.put("endTime", s[3]);
            doc.put("room", s[4]);
            doc.put("year", s[5]);
            doc.put("lecturerId", lecturers.get(s[6]));
            doc.put("department", "HNDIT");
            doc.put("isActive", true);

            String docId = s[0] + "_" + ((String) s[1]) + "_" + ((String) s[2]);
            db.collection("schedules").document(docId).set(doc).get();
            System.out.println("✅ Schedule: " + s[0]);
        }
    }

    private static Map<String, String> seedDevices() throws ExecutionException, InterruptedException {
        System.out.println("🛱️ Seeding Devices...");
        Map<String, String> deviceMap = new HashMap<>();

        String[][] devices = {
                {"ESP32_001", "Main Entrance", "Lab 01"},
                {"ESP32_002", "Side Entrance", "Lab 02"},
                {"ESP32_003", "Lecture Hall A", "Lab 03"}
        };

        for (String[] d : devices) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("deviceId", d[0]);
            doc.put("location", d[1]);
            doc.put("room", d[2]);
            doc.put("isActive", true);
            doc.put("lastSeen", Timestamp.now());

            db.collection("devices").document(d[0]).set(doc).get();
            deviceMap.put(d[0], d[0]);
            System.out.println("✅ Device: " + d[0]);
        }

        return deviceMap;
    }

private static void seedAttendance(Map<String, String> users, Map<String, String> devices) throws ExecutionException, InterruptedException {
    System.out.println("📝 Seeding Attendance...");

    List<String> deviceKeys = new ArrayList<>(devices.keySet());
    String[] subjectCodes = {"HNDIT401", "HNDIT402", "HNDIT403"};

    String[] dates = {
            java.time.LocalDate.now().minusDays(2).toString(),
            java.time.LocalDate.now().minusDays(1).toString(),
            java.time.LocalDate.now().toString()
    };

    for (String date : dates) {
        for (String email : users.keySet()) {
            String registrationNumber = users.get(email);  // ✅ registration number as unique student ID
            String vertexLabel = registrationNumber;

            for (int i = 0; i < subjectCodes.length; i++) {
                String subjectCode = subjectCodes[i];
                String rawDocId = registrationNumber + "_" + date + "_" + subjectCode;

                // ✅ Sanitize to avoid illegal Firestore characters like '/'
                String safeDocId = rawDocId.replaceAll("[^a-zA-Z0-9_\\-]", "_");

                Map<String, Object> doc = new HashMap<>();
                doc.put("registrationNumber", registrationNumber);
                doc.put("vertexLabel", vertexLabel);
                doc.put("deviceId", deviceKeys.get(i % deviceKeys.size()));
                doc.put("timestamp", Timestamp.now());
                doc.put("subjectCode", subjectCode);
                doc.put("date", date);
                doc.put("status", i % 4 == 0 ? "Present" : (i % 4 == 1 ? "Present" : (i % 4 == 2 ? "Late" : "Absent")));
                doc.put("location", "Lab 0" + (i + 1));
                doc.put("confidence", 0.9 + Math.random() * 0.1);
                doc.put("studentReview", "confirmed");
                doc.put("createdAt", Timestamp.now());

                db.collection("attendance").document(safeDocId).set(doc).get();
                System.out.println("✅ Attendance for " + registrationNumber + " (" + subjectCode + ") on " + date);
            }
        }
    }

    System.out.println("🌟 Attendance seeding completed.");
}


    private static void seedAttendanceGoal() throws ExecutionException, InterruptedException {
        System.out.println("🎯 Seeding Attendance Goal...");

        Map<String, Object> goalDoc = new HashMap<>();
        goalDoc.put("requiredPercentage", 80);
        goalDoc.put("description", "Minimum attendance required for exam eligibility");
        goalDoc.put("isActive", true);
        goalDoc.put("createdAt", Timestamp.now());

        db.collection("settings").document("attendanceGoal").set(goalDoc).get();
        System.out.println("✅ Attendance goal set to 80%");
    }
}
