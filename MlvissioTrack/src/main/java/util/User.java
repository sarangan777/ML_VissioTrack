package util;

public class User {
    private String id;
    private String email;
    private String fullName;
    private String registrationNumber;
    private String vertexLabel;
    private String role;
    private String password; // optional to keep internally

    public User() {}

    public User(String id, String email, String fullName, String registrationNumber,
                String vertexLabel, String role, String password) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.registrationNumber = registrationNumber;
        this.vertexLabel = vertexLabel;
        this.role = role;
        this.password = password;
    }

    // Getters
    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getRegistrationNumber() { return registrationNumber; }
    public String getVertexLabel() { return vertexLabel; }
    public String getRole() { return role; }
    public String getPassword() { return password; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
    public void setVertexLabel(String vertexLabel) { this.vertexLabel = vertexLabel; }
    public void setRole(String role) { this.role = role; }
    public void setPassword(String password) { this.password = password; }
}
