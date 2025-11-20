import { User, Role } from '../types';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid email or password.');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));

    return data.user;
};

export const signup = async (name: string, email: string, role: Role, password: string, registerNumber?: string): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            email,
            password,
            role,
            registrationNumber: registerNumber
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'An account with this email already exists.');
    }

    // After successful registration, log the user in
    return login(email, password);
};

export const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
};

export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
        return JSON.parse(userJson);
    }
    return null;
};