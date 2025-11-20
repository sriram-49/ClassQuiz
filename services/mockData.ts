import { User, Role } from '../types';

export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Dr. Evelyn Reed',
    email: 'instructor@test.com',
    password: 'password123',
    role: Role.INSTRUCTOR,
  },
  {
    id: 2,
    name: 'Alex Johnson',
    email: 'student@test.com',
    password: 'password123',
    role: Role.STUDENT,
    registerNumber: 'S12345',
  },
  {
    id: 3,
    name: 'Maria Garcia',
    email: 'student2@test.com',
    password: 'password123',
    role: Role.STUDENT,
    registerNumber: 'S67890',
  }
];

export const initializeMockData = () => {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(mockUsers));
    }
    if (!localStorage.getItem('quizzes')) {
        localStorage.setItem('quizzes', JSON.stringify([]));
    }
    if (!localStorage.getItem('attempts')) {
        localStorage.setItem('attempts', JSON.stringify([]));
    }
};

// Initialize on load
initializeMockData();