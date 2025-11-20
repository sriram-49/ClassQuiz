import { Quiz, Question, Attempt } from '../types';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const generateQuizCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const createQuiz = async (instructorId: number | string, topic: string, difficulty: string, timerMinutes: number, questions: Question[], totalMarks: number): Promise<Quiz> => {
    const quizCode = generateQuizCode();
    
    const response = await fetch(`${API_URL}/quizzes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            quizCode,
            topic,
            difficulty,
            timerMinutes,
            questions
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create quiz');
    }

    const data = await response.json();
    return {
        id: data.quiz.id,
        instructorId,
        topic,
        difficulty,
        timerMinutes,
        questions,
        quizCode,
        createdAt: new Date().toISOString(),
        totalMarks,
        isArchived: false
    };
};

export const getQuizzesByInstructor = async (instructorId: number | string): Promise<Quiz[]> => {
    const response = await fetch(`${API_URL}/quizzes/instructor`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
    }

    const quizzes = await response.json();
    
    return quizzes.map((quiz: any) => ({
        id: quiz.id,
        instructorId: quiz.instructorId,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        timerMinutes: quiz.timerMinutes,
        questions: quiz.questions,
        quizCode: quiz.quizCode,
        createdAt: quiz.createdAt,
        totalMarks: quiz.questions.reduce((sum: number, q: Question) => sum + q.marks, 0),
        isArchived: quiz.isArchived || false
    }));
};

export const getQuizByCode = async (code: string): Promise<Quiz | undefined> => {
    try {
        const response = await fetch(`${API_URL}/quizzes/code/${code}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            return undefined;
        }

        const quiz = await response.json();
        
        return {
            id: quiz.id,
            instructorId: quiz.instructorId,
            topic: quiz.topic,
            difficulty: quiz.difficulty,
            timerMinutes: quiz.timerMinutes,
            questions: quiz.questions,
            quizCode: quiz.quizCode,
            createdAt: quiz.createdAt,
            totalMarks: quiz.questions.reduce((sum: number, q: Question) => sum + q.marks, 0),
            isArchived: false
        };
    } catch (error) {
        return undefined;
    }
};

export const getAttemptsForQuiz = async (quizId: number | string): Promise<(Attempt & { studentName: string; registerNumber?: string })[]> => {
    const response = await fetch(`${API_URL}/quizzes/${quizId}/results`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to fetch quiz results');
    }

    const results = await response.json();
    
    return results.map((result: any) => ({
        id: result.id,
        quizId: result.quizId,
        studentId: result.studentId,
        studentName: result.studentName,
        registerNumber: result.studentRegNumber,
        answers: result.answers,
        score: result.score,
        total: result.totalQuestions,
        submittedAt: result.submittedAt
    }));
};

export const getAttemptsForStudent = async (studentId: number | string): Promise<(Attempt & { quizTopic: string })[]> => {
    const response = await fetch(`${API_URL}/attempts/student`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to fetch attempts');
    }

    const attempts = await response.json();
    
    return attempts.map((attempt: any) => ({
        id: attempt.id,
        quizId: attempt.quizId,
        studentId: attempt.studentId,
        quizTopic: attempt.topic,
        answers: attempt.answers,
        score: attempt.score,
        total: attempt.totalQuestions,
        submittedAt: attempt.submittedAt
    }));
};

export const hasStudentAttemptedQuiz = async (studentId: number | string, quizId: number | string): Promise<boolean> => {
    try {
        const attempts = await getAttemptsForStudent(studentId);
        return attempts.some(a => a.quizId === quizId);
    } catch (error) {
        return false;
    }
};

export const submitAttempt = async (quizId: number | string, studentId: number | string, answers: { [questionIndex: number]: string }): Promise<Attempt> => {
    const response = await fetch(`${API_URL}/attempts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            quizId: quizId.toString(),
            answers,
            timeTakenSeconds: 0
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit attempt');
    }

    const data = await response.json();
    
    return {
        id: data.attemptId,
        quizId,
        studentId,
        answers,
        score: data.score,
        total: data.totalQuestions,
        submittedAt: new Date().toISOString()
    };
};

export const archiveQuiz = async (quizId: number | string, status: boolean): Promise<Quiz> => {
    throw new Error('Archive functionality not yet implemented in backend');
};

export const duplicateQuiz = async (quizId: number | string): Promise<Quiz> => {
    throw new Error('Duplicate functionality not yet implemented in backend');
};

export const importQuiz = async (quizData: any): Promise<Quiz> => {
    return createQuiz(
        quizData.instructorId,
        quizData.topic,
        quizData.difficulty,
        quizData.timerMinutes,
        quizData.questions,
        quizData.totalMarks
    );
};

const lzw_encode = (s: string): string => {
    if (!s) return "";
    const dict: {[key: string]: number} = {};
    const data = (s + "").split("");
    const out = [];
    let currChar;
    let phrase = data[0];
    let code = 256;
    for (let i = 1; i < data.length; i++) {
        currChar = data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        } else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase = currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    return out.map(char => String.fromCharCode(char)).join("");
}

const lzw_decode = (s: string): string => {
    if (!s) return "";
    const dict: {[key: number]: string} = {};
    const data = (s + "").split("");
    let currChar = data[0];
    let oldPhrase = currChar;
    const out = [currChar];
    let code = 256;
    let phrase;
    for (let i = 1; i < data.length; i++) {
        const currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        } else {
            phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}

export const encodeQuizData = (quiz: Quiz): string => {
    try {
        const json = JSON.stringify(quiz);
        const compressed = lzw_encode(json);
        return btoa(encodeURIComponent(compressed));
    } catch (e) {
        console.error("Failed to encode quiz", e);
        return '';
    }
};

export const decodeQuizData = (encoded: string): Quiz | null => {
    try {
        const safeEncoded = encoded.replace(/ /g, '+');
        const compressed = decodeURIComponent(atob(safeEncoded));
        const json = lzw_decode(compressed);
        return JSON.parse(json);
    } catch (e) {
        console.error("Failed to decode quiz", e);
        return null;
    }
};
