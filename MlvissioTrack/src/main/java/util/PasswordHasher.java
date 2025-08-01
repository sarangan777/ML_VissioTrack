package util;

import org.mindrot.jbcrypt.BCrypt;

public class PasswordHasher {
    public static void main(String[] args) {
        String plainPassword = "gajan123";  // You can change this
        String hashed = BCrypt.hashpw(plainPassword, BCrypt.gensalt());
        System.out.println("Hashed Password: " + hashed);
    }
}
