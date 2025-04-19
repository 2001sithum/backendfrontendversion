import {createSlice , createAsyncThunk} from '@reduxjs/toolkit';
import authService from './authService';
import { RootState } from '../../app/store';
import axios from 'axios';

// Types
interface User { id: number; username: string; email: string; }
interface AuthState { user: User | null; token: string | null; isError: boolean; isSuccess: boolean; isLoading: boolean; message: string; }
interface AuthResponse { success: boolean; token: string; user: User; message?: string; }

const token = localStorage.getItem('token');
const initialState: AuthState = { user: null, token, isError: false, isSuccess: false, isLoading: false, message: '', };

// Thunks
export const register = createAsyncThunk<AuthResponse, object, { rejectValue: string }>('auth/register', async (d, t) => { try { return await authService.register(d); } catch (e: any) { return t.rejectWithValue(authService.extractErrorMessage(e)); } });
export const login = createAsyncThunk<AuthResponse, object, { rejectValue: string }>('auth/login', async (d, t) => { try { return await authService.login(d); } catch (e: any) { return t.rejectWithValue(authService.extractErrorMessage(e)); } });
export const logout = createAsyncThunk('auth/logout', async () => { authService.logout(); });
export const getMe = createAsyncThunk<User, void, { state: RootState; rejectValue: string }>('auth/getMe', async (_, t) => { try { return await authService.getMe(); } catch (e: any) { const msg = authService.extractErrorMessage(e); if (axios.isAxiosError(e) && e.response?.status === 401) t.dispatch(logout()); return t.rejectWithValue(msg); } });

// Slice
export const authSlice = createSlice({
    name: 'auth', initialState,
    reducers: { reset: (s) => { s.isLoading = false; s.isSuccess = false; s.isError = false; s.message = ''; } },
    extraReducers: (b) => { b
        .addCase(register.pending, (s) => { s.isLoading = true; }) .addCase(register.fulfilled, (s, a) => { s.isLoading = false; s.isSuccess = true; s.message = a.payload.message || 'Registered!'; }) .addCase(register.rejected, (s, a) => { s.isLoading = false; s.isError = true; s.message = a.payload || 'Reg failed'; s.user = null; s.token = null; })
        .addCase(login.pending, (s) => { s.isLoading = true; }) .addCase(login.fulfilled, (s, a) => { s.isLoading = false; s.isSuccess = true; s.user = a.payload.user; s.token = a.payload.token; s.message = a.payload.message || 'Login OK'; }) .addCase(login.rejected, (s, a) => { s.isLoading = false; s.isError = true; s.message = a.payload || 'Login failed'; s.user = null; s.token = null; })
        .addCase(logout.fulfilled, (s) => { s.user = null; s.token = null; s.isLoading = false; s.isSuccess = false; s.isError = false; s.message = ''; })
        .addCase(getMe.pending, (s) => { s.isLoading = true; }) .addCase(getMe.fulfilled, (s, a) => { s.isLoading = false; s.user = a.payload; }) .addCase(getMe.rejected, (s, a) => { s.isLoading = false; s.isError = true; s.message = a.payload || 'GetMe failed'; s.user = null; s.token = null; });
    },
});
export const { reset } = authSlice.actions; export default authSlice.reducer; export type { AuthResponse, User as AuthUser };
