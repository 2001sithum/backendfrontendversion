import axios from 'axios';

// Use environment variable or script default for backend port
const BACKEND_PORT =  "5008";
const API_BASE_URL = `http://localhost:${BACKEND_PORT}/api`;

let csrfToken: string | null = null;

export const fetchCsrfToken = async (): Promise<string | null> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/csrf-token`, { withCredentials: true });
        csrfToken = response.data.csrfToken;
        console.log("CSRF Token fetched");
        return csrfToken;
    } catch (error) {
        console.error("Failed fetch CSRF:", error);
        csrfToken = null;
        return null;
    }
};

const axiosInstance = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

axiosInstance.interceptors.request.use( async (config) => {
    const method = config.method?.toLowerCase();
    if (!csrfToken && method && ['post', 'put', 'delete', 'patch'].includes(method)) await fetchCsrfToken();
    if (csrfToken && method && ['post', 'put', 'delete', 'patch'].includes(method)) config.headers['X-CSRF-Token'] = csrfToken;
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error) );

axiosInstance.interceptors.response.use( (response) => response, async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF') && !originalRequest._retry) {
        originalRequest._retry = true;
        console.warn("CSRF error, retrying...");
        const newCsrfToken = await fetchCsrfToken();
        if (newCsrfToken) {
            originalRequest.headers['X-CSRF-Token'] = newCsrfToken;
            return axiosInstance(originalRequest);
        }
    }
    return Promise.reject(error);
} );
export default axiosInstance;
