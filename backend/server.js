const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./quiz.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Create tables
function initializeDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    registration_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    quiz_code TEXT UNIQUE NOT NULL,
    topic TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    timer_minutes INTEGER NOT NULL,
    questions TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_reg_number TEXT,
    quiz_id TEXT NOT NULL,
    quiz_code TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    answers TEXT NOT NULL,
    time_taken_seconds INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
  )`);

  console.log('Database tables initialized');
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role, registrationNumber } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();
    
    db.run(
      `INSERT INTO users (id, email, password, name, role, registration_number) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, email, hashedPassword, name, role, registrationNumber || null],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Failed to register user' });
        }
        res.json({ message: 'Registration successful', userId });
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    try {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          name: user.name 
        },
        SECRET_KEY,
        { expiresIn: '24h' }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          registrationNumber: user.registration_number
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error during login' });
    }
  });
});

// ==================== QUIZ ROUTES ====================

// Create Quiz
app.post('/api/quizzes', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Only instructors can create quizzes' });
  }
  
  const { quizCode, topic, difficulty, timerMinutes, questions } = req.body;
  const quizId = generateId();
  
  db.run(
    `INSERT INTO quizzes (id, quiz_code, topic, instructor_id, difficulty, timer_minutes, questions) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [quizId, quizCode, topic, req.user.id, difficulty, timerMinutes, JSON.stringify(questions)],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Quiz code already exists' });
        }
        console.error('Create quiz error:', err);
        return res.status(500).json({ error: 'Failed to create quiz' });
      }
      res.json({ 
        message: 'Quiz created successfully', 
        quizId,
        quiz: {
          id: quizId,
          quizCode,
          topic,
          instructorId: req.user.id,
          difficulty,
          timerMinutes,
          questions: JSON.parse(JSON.stringify(questions))
        }
      });
    }
  );
});

// Get Quiz by Code (for students)
app.get('/api/quizzes/code/:code', authenticateToken, (req, res) => {
  db.get(
    `SELECT q.*, u.name as instructor_name FROM quizzes q 
     JOIN users u ON q.instructor_id = u.id 
     WHERE q.quiz_code = ?`,
    [req.params.code],
    (err, quiz) => {
      if (err) {
        console.error('Get quiz error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
      
      res.json({
        id: quiz.id,
        quizCode: quiz.quiz_code,
        topic: quiz.topic,
        instructorId: quiz.instructor_id,
        instructorName: quiz.instructor_name,
        difficulty: quiz.difficulty,
        timerMinutes: quiz.timer_minutes,
        questions: JSON.parse(quiz.questions),
        createdAt: quiz.created_at
      });
    }
  );
});

// Get Instructor's Quizzes
app.get('/api/quizzes/instructor', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  db.all(
    `SELECT q.*, COUNT(a.id) as attempt_count 
     FROM quizzes q 
     LEFT JOIN attempts a ON q.id = a.quiz_id 
     WHERE q.instructor_id = ? 
     GROUP BY q.id 
     ORDER BY q.created_at DESC`,
    [req.user.id],
    (err, quizzes) => {
      if (err) {
        console.error('Get instructor quizzes error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const formattedQuizzes = quizzes.map(quiz => ({
        id: quiz.id,
        quizCode: quiz.quiz_code,
        topic: quiz.topic,
        instructorId: quiz.instructor_id,
        difficulty: quiz.difficulty,
        timerMinutes: quiz.timer_minutes,
        questions: JSON.parse(quiz.questions),
        createdAt: quiz.created_at,
        attemptCount: quiz.attempt_count || 0
      }));
      
      res.json(formattedQuizzes);
    }
  );
});

// Delete Quiz
app.delete('/api/quizzes/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // First delete all attempts for this quiz
  db.run('DELETE FROM attempts WHERE quiz_id = ?', [req.params.id], (err) => {
    if (err) {
      console.error('Delete attempts error:', err);
      return res.status(500).json({ error: 'Failed to delete quiz attempts' });
    }
    
    // Then delete the quiz
    db.run(
      'DELETE FROM quizzes WHERE id = ? AND instructor_id = ?',
      [req.params.id, req.user.id],
      function(err) {
        if (err) {
          console.error('Delete quiz error:', err);
          return res.status(500).json({ error: 'Failed to delete quiz' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Quiz not found' });
        }
        
        res.json({ message: 'Quiz deleted successfully' });
      }
    );
  });
});

// ==================== ATTEMPT ROUTES ====================

// Submit Quiz Attempt
app.post('/api/attempts', authenticateToken, (req, res) => {
  const { quizId, answers, timeTakenSeconds } = req.body;
  const attemptId = generateId();
  
  // First get the quiz to calculate score
  db.get('SELECT * FROM quizzes WHERE id = ?', [quizId], (err, quiz) => {
    if (err || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Parse quiz questions
    const questions = JSON.parse(quiz.questions);
    
    // Calculate score
    let score = 0;
    questions.forEach((q, index) => {
      const correctOptionPrefix = q.answer.trim().toUpperCase() + ".";
      const selectedAnswer = answers[index];
      if (selectedAnswer && selectedAnswer.startsWith(correctOptionPrefix)) {
        score += q.marks;
      }
    });
    
    const finalScore = parseFloat(score.toFixed(2));
    const totalQuestions = questions.reduce((sum, q) => sum + q.marks, 0);
    
    // Get student info
    db.get('SELECT name, registration_number FROM users WHERE id = ?', [req.user.id], (err, student) => {
      if (err || !student) {
        return res.status(500).json({ error: 'Failed to fetch student info' });
      }
      
      db.run(
        `INSERT INTO attempts (id, student_id, student_name, student_reg_number, quiz_id, quiz_code, score, total_questions, answers, time_taken_seconds) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          attemptId, 
          req.user.id, 
          student.name,
          student.registration_number,
          quizId, 
          quiz.quiz_code,
          finalScore, 
          totalQuestions,
          JSON.stringify(answers), 
          timeTakenSeconds || 0
        ],
        function(err) {
          if (err) {
            console.error('Submit attempt error:', err);
            return res.status(500).json({ error: 'Failed to submit attempt' });
          }
          res.json({ 
            message: 'Attempt submitted successfully', 
            attemptId,
            score: finalScore,
            totalQuestions
          });
        }
      );
    });
  });
});

// Get Student's Attempts
app.get('/api/attempts/student', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  db.all(
    `SELECT a.*, q.topic, q.difficulty, q.timer_minutes 
     FROM attempts a 
     JOIN quizzes q ON a.quiz_id = q.id 
     WHERE a.student_id = ? 
     ORDER BY a.submitted_at DESC`,
    [req.user.id],
    (err, attempts) => {
      if (err) {
        console.error('Get student attempts error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const formattedAttempts = attempts.map(attempt => ({
        id: attempt.id,
        studentId: attempt.student_id,
        quizId: attempt.quiz_id,
        quizCode: attempt.quiz_code,
        topic: attempt.topic,
        difficulty: attempt.difficulty,
        score: attempt.score,
        totalQuestions: attempt.total_questions,
        answers: JSON.parse(attempt.answers),
        timeTakenSeconds: attempt.time_taken_seconds,
        submittedAt: attempt.submitted_at
      }));
      
      res.json(formattedAttempts);
    }
  );
});

// Get Quiz Results (for instructors)
app.get('/api/quizzes/:id/results', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  db.all(
    `SELECT a.* 
     FROM attempts a 
     JOIN quizzes q ON a.quiz_id = q.id 
     WHERE a.quiz_id = ? AND q.instructor_id = ?
     ORDER BY a.submitted_at DESC`,
    [req.params.id, req.user.id],
    (err, results) => {
      if (err) {
        console.error('Get quiz results error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const formattedResults = results.map(result => ({
        id: result.id,
        studentId: result.student_id,
        studentName: result.student_name,
        studentRegNumber: result.student_reg_number,
        quizId: result.quiz_id,
        quizCode: result.quiz_code,
        score: result.score,
        totalQuestions: result.total_questions,
        answers: JSON.parse(result.answers),
        timeTakenSeconds: result.time_taken_seconds,
        submittedAt: result.submitted_at
      }));
      
      res.json(formattedResults);
    }
  );
});

// ==================== SERVER START ====================

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Database: quiz.db`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
