import axiosInstance, { fetchCsrfToken } from '../../lib/axiosInstance';
import axios from 'axios';

const API_URL = '/auth/'; // Relative path is fine now

// Define Interfaces (can be shared if needed)
interface UserData { id: number; username: string; email: string; }
interface AuthResponse { success: boolean; token: string; user: UserData; message?: string; }
interface GetMeResponse { success: boolean; data: UserData; }
interface ErrorResponse { success: boolean; message: string; }

// Type guard
function isAxiosErrorWithResponseData(error: any): error is import('axios').AxiosError<ErrorResponse> {
    return axios.isAxiosError(error) && !!error.response?.data;
}

// Service functions
const register = async (userData: object): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(API_URL + 'register', userData);
    if (response.data?.token) localStorage.setItem('token', response.data.token);
    return response.data;
};
const login = async (userData: object): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(API_URL + 'login', userData);
    if (response.data?.token) localStorage.setItem('token', response.data.token);
    return response.data;
};
const logout = (): void => { localStorage.removeItem('token'); };
const getMe = async (): Promise<UserData> => {
    const response = await axiosInstance.get<GetMeResponse>(API_URL + 'me');
    return response.data.data;
};
const extractErrorMessage = (e: any): string => {
    if (isAxiosErrorWithResponseData(e)) return e.response?.data.message || 'API error';
    if (e instanceof Error) return e.message;
    return String(e);
};

const authService = { register, login, logout, getMe, extractErrorMessage, fetchCsrfToken };
export default authService;
