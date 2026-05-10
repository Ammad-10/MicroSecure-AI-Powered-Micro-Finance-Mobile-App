import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL - For Android emulator use 10.0.2.2, for iOS simulator use localhost
// Base URL - For Android emulator use 10.0.2.2, for iOS simulator use localhost
// Base URL - For Android emulator use 10.0.2.2, for iOS simulator use localhost
// For physical device, use your computer's IP address (find using ipconfig/ifconfig)
// const API_BASE_URL = 'http://localhost:8005';      // Use for iOS Simulator
// const API_BASE_URL = 'http://10.0.2.2:8005';       // Use for Android Emulator
const API_BASE_URL = 'http://10.46.43.47:8005';     // Use for Physical Device (Current Machine IP)

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// API Functions

/**
 * User signup
 */
export const signup = async (userData) => {
    try {
        console.log('[API] Signup payload keys:', Object.keys(userData));
        console.log('[API] date_of_birth:', userData.date_of_birth);
        console.log('[API] face_image length:', userData.face_image?.length);
        const response = await api.post('/api/auth/signup', userData);
        return { success: true, data: response.data };
    } catch (error) {
        const detail = error.response?.data?.detail;
        // Handle both string and array detail formats from FastAPI
        let errorMsg = 'Signup failed. Please try again.';
        if (typeof detail === 'string') {
            errorMsg = detail;
        } else if (Array.isArray(detail)) {
            errorMsg = detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('\n');
        }
        console.log('[API] Signup error:', errorMsg);
        return { success: false, error: errorMsg };
    }
};

/**
 * User login
 */
export const login = async (username, password) => {
    try {
        const response = await api.post('/api/auth/login', {
            username,
            password,
        });

        // Store token
        await AsyncStorage.setItem('access_token', response.data.access_token);

        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.detail || 'Login failed. Please check your credentials.',
        };
    }
};

/**
 * Get current user info
 */
export const getCurrentUser = async () => {
    try {
        const response = await api.get('/api/auth/me');
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.detail || 'Failed to get user info.',
        };
    }
};

/**
 * Pay a bill
 */
export const payBill = async (billData) => {
    try {
        const response = await api.post('/api/billing/pay-bill', billData);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.detail || 'Bill payment failed.',
        };
    }
};

/**
 * Send money to another user
 */
export const sendMoney = async (transferData) => {
    try {
        const response = await api.post('/api/billing/send-money', transferData);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.detail || 'Money transfer failed.',
        };
    }
};

/**
 * Verify Transaction Face
 */
export const verifyTransaction = async (cnic, faceImageBase64) => {
    try {
        const response = await api.post('/api/billing/verify-transaction', {
            cnic,
            face_image: faceImageBase64,
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.detail || 'Verification failed.',
        };
    }
};

export const getTransactions = async () => {
    try {
        const response = await api.get('/api/billing/transactions');
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.detail || 'Failed to fetch transactions.',
        };
    }
};

/**
 * Verify Liveness (Backend)
 */
export const verifyLiveness = async (frames) => {
    try {
        const response = await api.post('/api/auth/verify-liveness', {
            frames: frames,
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.detail || 'Liveness verification failed.',
        };
    }
};

/**
 * Detect Hand Gesture (Backend)
 */
export const detectGesture = async (frame) => {
    try {
        const response = await api.post('/api/auth/detect-gesture', {
            frames: [frame], // Backend expects an array of frames
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.detail || 'Gesture detection failed.',
        };
    }
};

/**
 * Logout
 */
export const logout = async () => {
    await AsyncStorage.removeItem('access_token');
};