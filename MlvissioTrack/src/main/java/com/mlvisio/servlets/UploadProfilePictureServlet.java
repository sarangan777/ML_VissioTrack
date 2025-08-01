package com.mlvisio.servlets;

import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import jakarta.servlet.ServletException;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;
import org.json.JSONObject;

@WebServlet("/api/uploadProfilePicture")
@MultipartConfig
public class UploadProfilePictureServlet extends HttpServlet {

    private static final String IMGUR_UPLOAD_URL = "https://api.imgur.com/3/image";
    private static final String IMGUR_CLIENT_ID = "b98c6214bd0d2f2"; 

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        Part filePart = request.getPart("image");
        if (filePart == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"success\": false, \"message\": \"No image uploaded\"}");
            return;
        }

        
        InputStream inputStream = filePart.getInputStream();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int len;
        while ((len = inputStream.read(buffer)) != -1) {
            baos.write(buffer, 0, len);
        }
        byte[] imageBytes = baos.toByteArray();
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        // Upload to Imgur
        HttpURLConnection conn = (HttpURLConnection) new URL(IMGUR_UPLOAD_URL).openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Authorization", "Client-ID " + IMGUR_CLIENT_ID);
        conn.setDoOutput(true);

        String postData = "image=" + base64Image;
        try (OutputStream os = conn.getOutputStream()) {
            os.write(postData.getBytes());
        }

        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        StringBuilder jsonResponse = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            jsonResponse.append(line);
        }
        reader.close();

        JSONObject result = new JSONObject(jsonResponse.toString());
        String imageUrl = result.getJSONObject("data").getString("link");

        // Return success with image URL
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(new JSONObject()
                .put("success", true)
                .put("data", new JSONObject().put("url", imageUrl))
                .toString());
    }
}
