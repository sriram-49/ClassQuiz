# Quiz Platform - SQLite Backend

This is the backend API server for the Quiz Platform application.

## Features

- **Authentication**: User registration and login with JWT tokens
- **Quiz Management**: Create, retrieve, and delete quizzes
- **Attempt Tracking**: Submit and retrieve quiz attempts
- **SQLite Database**: Lightweight, file-based database (quiz.db)
- **Auto-scoring**: Automatic quiz grading based on correct answers

## Installation

```bash
npm install
```

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "student",
    "registrationNumber": "REG001" // Optional, for students
  }
  ```

- `POST /api/auth/login` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  Returns: `{ token, user }`

### Quizzes (Requires Authentication)

- `POST /api/quizzes` - Create a new quiz (Instructor only)
- `GET /api/quizzes/instructor` - Get all quizzes for logged-in instructor
- `GET /api/quizzes/code/:code` - Get quiz by code
- `DELETE /api/quizzes/:id` - Delete a quiz (Instructor only)

### Attempts (Requires Authentication)

- `POST /api/attempts` - Submit a quiz attempt
  ```json
  {
    "quizId": "quiz123",
    "answers": { "0": "A. Option 1", "1": "B. Option 2" },
    "timeTakenSeconds": 300
  }
  ```

- `GET /api/attempts/student` - Get all attempts for logged-in student
- `GET /api/quizzes/:id/results` - Get all attempts for a quiz (Instructor only)

## Database Schema

### Users Table
- id (TEXT, PRIMARY KEY)
- email (TEXT, UNIQUE)
- password (TEXT, hashed with bcrypt)
- name (TEXT)
- role (TEXT: 'instructor' or 'student')
- registration_number (TEXT, optional)
- created_at (DATETIME)

### Quizzes Table
- id (TEXT, PRIMARY KEY)
- quiz_code (TEXT, UNIQUE)
- topic (TEXT)
- instructor_id (TEXT)
- difficulty (TEXT)
- timer_minutes (INTEGER)
- questions (TEXT, JSON array)
- created_at (DATETIME)

### Attempts Table
- id (TEXT, PRIMARY KEY)
- student_id (TEXT)
- student_name (TEXT)
- student_reg_number (TEXT)
- quiz_id (TEXT)
- quiz_code (TEXT)
- score (INTEGER)
- total_questions (INTEGER)
- answers (TEXT, JSON object)
- time_taken_seconds (INTEGER)
- submitted_at (DATETIME)

## Environment

- Node.js v16+
- SQLite3

## Security Notes

⚠️ **Important for Production:**
- Change the `SECRET_KEY` in server.js to a secure random string
- Use environment variables for sensitive configuration
- Enable HTTPS
- Add rate limiting
- Implement proper password policies

## Development

The database file `quiz.db` will be created automatically in the backend directory when you first run the server.

To reset the database, simply delete the `quiz.db` file and restart the server.
