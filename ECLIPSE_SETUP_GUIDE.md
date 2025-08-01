# Eclipse Setup Guide for MLVisioTrack

## 🚀 Complete Setup Instructions for Eclipse 2025-06 Enterprise Edition

### 1. **Project Import & Configuration**

#### Import Maven WAR Project:
1. **File** → **Import** → **Existing Maven Projects**
2. Browse to your `MLVisioTrack` folder
3. Select the `pom.xml` file
4. Click **Finish**

#### Configure Build Path:
1. Right-click project → **Properties**
2. **Java Build Path** → **Source**
3. Ensure these source folders exist:
   - `src/main/java`
   - `src/main/resources`
   - `src/main/webapp`
4. **Libraries** → **Modulepath/Classpath** → Ensure **Maven Dependencies** is present

#### Configure Deployment Assembly:
1. Right-click project → **Properties**
2. **Deployment Assembly**
3. Remove all entries and add:
   - **Source**: `src/main/webapp`, **Deploy Path**: `/`
   - **Source**: `Maven Dependencies`, **Deploy Path**: `/WEB-INF/lib`
   - **Source**: `src/main/java`, **Deploy Path**: `/WEB-INF/classes`
   - **Source**: `src/main/resources`, **Deploy Path**: `/WEB-INF/classes`

### 2. **Tomcat 10.1.43 Configuration**

#### Add Tomcat Server:
1. **Window** → **Show View** → **Servers**
2. Right-click in Servers view → **New** → **Server**
3. Select **Apache** → **Tomcat v10.0 Server**
4. Browse to your Tomcat installation directory
5. Set **JRE**: Java 21 (Eclipse Adoptium)

#### Server Configuration:
1. Double-click Tomcat server in Servers view
2. **Server Locations** → Select **Use Tomcat installation**
3. **Deploy path**: `webapps`
4. **Server Options**:
   - ✅ Serve modules without publishing
   - ✅ Publish module contexts to separate XML files
5. **Timeouts**: Start: 45s, Stop: 15s
6. **Save** the configuration

#### Add Project to Server:
1. Right-click Tomcat server → **Add and Remove...**
2. Move `MlvissioTrack` from Available to Configured
3. Click **Finish**

### 3. **Firebase Configuration**

#### Update Service Account Key:
1. Replace `src/main/resources/serviceAccountKey.json` with your actual Firebase credentials
2. Ensure the file is in the classpath

#### Verify Firebase Collections:
Run the seeder to create initial data:
```bash
cd MlvissioTrack
mvn exec:java -Dexec.mainClass="util.SeedUsers"
```

### 4. **Frontend Configuration**

#### Update API Base URL:
The frontend is already configured to use:
```typescript
baseURL: 'http://localhost:8080/MlvissioTrack/api'
```

#### Start React Development Server:
```bash
cd ML_vissio_react_app
npm install
npm run dev
```

### 5. **Debugging & Troubleshooting**

#### Check Server Logs:
1. **Console** view shows Tomcat startup logs
2. Look for these success messages:
   ```
   ✅ [CorsFilter] Initialized
   ✅ [LoginServlet] Firebase initialized successfully
   ✅ [DashboardStatsServlet] Firebase initialized successfully
   ```

#### Common Issues & Solutions:

**🔴 Blank Dashboard:**
- Check browser console for CORS errors
- Verify Tomcat is running on port 8080
- Test API directly: `http://localhost:8080/MlvissioTrack/api/stats/dashboard`

**🔴 Tomcat Stops Automatically:**
- Check Eclipse error log: **Window** → **Show View** → **Error Log**
- Increase JVM heap size: Server → **Open launch configuration** → **Arguments**:
  ```
  -Xms512m -Xmx1024m -XX:PermSize=256m -XX:MaxPermSize=512m
  ```

**🔴 Servlet Mapping Issues:**
- All servlets now use `@WebServlet` annotations
- Clean `web.xml` with only essential configuration
- No mixed annotation/XML mapping conflicts

**🔴 Firebase Connection Issues:**
- Verify `serviceAccountKey.json` is valid
- Check Firestore rules allow read/write
- Ensure collections exist (run SeedUsers)

#### Testing Endpoints:
Use these URLs to test your APIs:
- Login: `POST http://localhost:8080/MlvissioTrack/api/login`
- Dashboard: `GET http://localhost:8080/MlvissioTrack/api/stats/dashboard`
- Schedule: `GET http://localhost:8080/MlvissioTrack/api/schedule/today`
- Attendance: `GET http://localhost:8080/MlvissioTrack/api/attendance/student?email=gajan@mlvisio.com`

### 6. **Project Structure Verification**

Your project should look like this in Eclipse:
```
MlvissioTrack/
├── src/main/java/
│   └── com/mlvisio/
│       ├── filters/CorsFilter.java
│       ├── servlets/
│       │   ├── LoginServlet.java
│       │   ├── DashboardStatsServlet.java
│       │   ├── AttendanceServlet.java
│       │   ├── ScheduleServlet.java
│       │   └── UserManagementServlet.java
│       └── util/FirebaseInitializer.java
├── src/main/resources/
│   └── serviceAccountKey.json
├── src/main/webapp/
│   ├── WEB-INF/web.xml
│   └── index.html
└── pom.xml
```

### 7. **Default Login Credentials**

**Students:**
- Email: `gajan@mlvisio.com` | Password: `HNDIT/PT/2024/006`
- Email: `sarangan@mlvisio.com` | Password: `HNDIT/PT/2024/001`

**Admin:**
- Email: `admin1@mlvisio.com` | Password: `HNDIT-ADM-001`

### 8. **Success Indicators**

✅ **Server starts without errors**
✅ **Console shows servlet initialization messages**
✅ **Dashboard loads with real data**
✅ **Login works with test credentials**
✅ **API endpoints respond correctly**
✅ **No CORS errors in browser console**

If you follow this guide exactly, your MLVisioTrack application should work perfectly in Eclipse with Tomcat 10! 🎉