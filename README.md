# MLVisioTrack - Smart Attendance Management System

A comprehensive attendance management system built with React frontend and Java Jakarta EE backend, using Firebase Firestore as the database.

## Features

### Student Features
- **Dashboard**: View attendance statistics, recent activities, and quick actions
- **Schedule Management**: View class schedules and export to PDF
- **Attendance Reports**: View personal attendance records with export functionality
- **Profile Management**: Update personal information and profile picture
- **Attendance Review**: Request review for disputed attendance records

### Admin Features
- **Admin Dashboard**: Overview of system statistics and analytics
- **User Management**: Create, update, and manage student accounts
- **Schedule Management**: Create and manage class schedules
- **Attendance Review**: Review and approve/reject attendance disputes
- **Manual Attendance**: Mark attendance manually for students
- **Reports**: Generate comprehensive attendance reports

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Chart.js** for data visualization
- **React Toastify** for notifications
- **Lucide React** for icons

### Backend
- **Java 11** with Jakarta EE 10
- **Apache Tomcat** as application server
- **Firebase Admin SDK** for Firestore integration
- **BCrypt** for password hashing
- **Jackson** for JSON processing

### Database
- **Firebase Firestore** for data storage
- **Firebase Storage** for file uploads

## Project Structure

```
MLVisioTrack/
├── ML_vissio_react_app/          # React frontend
│   ├── src/
│   │   ├── components/           # Reusable React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service layer
│   │   ├── context/             # React context providers
│   │   └── types/               # TypeScript type definitions
│   └── public/                  # Static assets
└── MlvissioTrack/               # Java backend
    ├── src/main/java/
    │   └── com/mlvisio/
    │       ├── servlets/        # REST API endpoints
    │       ├── filters/         # CORS and other filters
    │       └── util/            # Utility classes
    ├── src/main/resources/      # Configuration files
    └── src/main/webapp/         # Web application resources
```

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- Java 11+
- Apache Tomcat 10+
- Firebase project with Firestore enabled

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MLVisioTrack
   ```

2. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Generate a service account key:
     - Go to Project Settings > Service Accounts
     - Click "Generate new private key"
     - Save the JSON file as `serviceAccountKey.json`
   - Place the file in `MlvissioTrack/src/main/resources/`

3. **Build and Deploy**
   ```bash
   cd MlvissioTrack
   mvn clean package
   ```
   - Deploy the generated WAR file to Tomcat
   - Or use your IDE to run on Tomcat directly

4. **Seed Initial Data**
   ```bash
   mvn exec:java -Dexec.mainClass="util.SeedUsers"
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd ML_vissio_react_app
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/uploadProfilePicture` - Upload profile picture

### Dashboard
- `GET /api/stats/dashboard` - Get dashboard statistics

### Users
- `GET /api/users/list` - List all users
- `POST /api/users/create` - Create new user
- `PUT /api/users/update/{id}` - Update user
- `DELETE /api/users/delete/{id}` - Delete user

### Attendance
- `GET /api/attendance/report` - Get attendance reports
- `GET /api/attendance/student` - Get student attendance
- `POST /api/attendance/mark` - Mark attendance
- `POST /api/attendance/review` - Submit review request

### Schedule
- `GET /api/schedule/today` - Get today's schedule
- `GET /api/schedule/week` - Get weekly schedule
- `POST /api/schedule/create` - Create new schedule
- `PUT /api/schedule/update/{id}` - Update schedule
- `DELETE /api/schedule/delete/{id}` - Delete schedule

## Default Login Credentials

### Students
- **Email**: `gajan@mlvisio.com`
- **Password**: `HNDIT/PT/2024/006`

- **Email**: `sarangan@mlvisio.com`
- **Password**: `HNDIT/PT/2024/001`

### Admin
- **Email**: `admin1@mlvisio.com`
- **Password**: `HNDIT-ADM-001`

## Database Schema

### Collections

#### users
- `name`: String - Full name
- `email`: String - Email address (unique)
- `password`: String - Hashed password
- `registrationNumber`: String - Student registration number
- `department`: String - Department (HNDIT, HNDA, etc.)
- `role`: String - "student" or "admin"
- `year`: String - Academic year
- `type`: String - "Full Time" or "Part Time"
- `isActive`: Boolean - Account status

#### attendance
- `studentId`: String - Reference to user
- `date`: String - Date in YYYY-MM-DD format
- `status`: String - "Present", "Absent", "Late", "Excused"
- `subjectCode`: String - Subject identifier
- `timestamp`: Timestamp - Check-in time
- `location`: String - Classroom/location
- `confidence`: Number - ML confidence score

#### schedules
- `subjectCode`: String - Subject identifier
- `dayOfWeek`: String - Day of the week
- `startTime`: String - Start time (HH:MM)
- `endTime`: String - End time (HH:MM)
- `room`: String - Classroom
- `lecturerId`: String - Reference to lecturer
- `department`: String - Department
- `year`: String - Academic year
- `isActive`: Boolean - Schedule status

#### lecturers
- `lecturerId`: String - Lecturer identifier
- `name`: String - Full name
- `email`: String - Email address
- `department`: String - Department

## Development

### Running in Development Mode

1. **Backend**: Deploy to Tomcat and ensure it's running on `http://localhost:8080`
2. **Frontend**: Run `npm run dev` in the React app directory

### Building for Production

1. **Backend**: Use `mvn clean package` to create WAR file
2. **Frontend**: Use `npm run build` to create production build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.