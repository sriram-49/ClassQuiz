export enum Role {
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

export enum View {
  AUTH = 'auth',
  INSTRUCTOR_DASHBOARD = 'instructor_dashboard',
  CREATE_QUIZ = 'create_quiz',
  VIEW_QUIZ_RESULTS = 'view_quiz_results',
  STUDENT_DASHBOARD = 'student_dashboard',
  TAKE_QUIZ = 'take_quiz',
  PREVIOUS_SCORES = 'previous_scores',
  QUIZ_RESULT = 'quiz_result',
  VIEW_QUIZ = 'view_quiz',
}

export interface User {
  id: number | string; // Can be number or string from backend
  name: string;
  email: string;
  password?: string; // Optional, only used for registration
  role: Role;
  registerNumber?: string; // Optional, only for students
}

export interface Question {
  question: string;
  options: string[];
  answer: string; // e.g., "A", "B", "C", or "D"
  difficulty: string; // 'Easy', 'Medium', or 'Hard'
  marks: number;
}

export interface Quiz {
  id: number | string; // Can be number or string from backend
  instructorId: number | string;
  topic: string;
  difficulty: string; // Will be 'Mixed'
  timerMinutes: number;
  questions: Question[];
  quizCode: string;
  createdAt: string;
  totalMarks: number;
  isArchived?: boolean;
}

export interface Attempt {
  id: number | string; // Can be number or string from backend
  quizId: number | string;
  studentId: number | string;
  answers: { [questionIndex: number]: string };
  score: number;
  total: number; // Represents total marks
  submittedAt: string;
}

export interface QuizResultData {
    score: number;
    total: number;
    quizTopic: string;
}

// Constants from CreateQuizForm
export const NUM_QUESTIONS = [5, 10, 15, 20];
export const TIMER_DURATIONS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 45, 60];