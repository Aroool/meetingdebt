import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
    baseURL: API_URL,
});

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

// Handle 401 responses globally (token expired)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Try refreshing the session
            const { data: { session } } = await supabase.auth.refreshSession();
            if (session) {
                // Retry the original request with new token
                error.config.headers.Authorization = `Bearer ${session.access_token}`;
                return api.request(error.config);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
