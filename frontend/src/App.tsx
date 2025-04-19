import React, {useEffect, useState, ReactNode, Suspense, JSX} from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Provider } from 'react-redux'; // Import Provider
import { store } from './app/store'; // Import store
import { useAppDispatch, useAppSelector } from './app/hooks';
import { register as registerAction, login as loginAction, reset, logout, getMe } from './features/auth/authSlice';
import { fetchCsrfToken } from './lib/axiosInstance';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, User, Mail, Lock, AlertCircle, Home, Settings, Menu, X, LogOut } from 'lucide-react';

// Zod Schemas (defined once)
const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email" }).min(1, { message: "Required" }),
    password: z.string().min(1, { message: "Required" }),
});

const registerSchema = z.object({
    username: z.string().min(3, { message: "Min 3 chars" }),
    email: z.string().email({ message: "Invalid email" }).min(1, { message: "Required" }),
    password: z.string().min(6, { message: "Min 6 chars" }),
    confirmPassword: z.string().min(1, { message: "Required" }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type LoginFormInputs = z.infer<typeof loginSchema>;
type RegisterFormInputs = z.infer<typeof registerSchema>;

// --------------- Auth Component Logic ---------------
const AuthComponent: React.FC = () => {
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user, token, isLoading, isError, isSuccess, message } = useAppSelector((s) => s.auth);
    const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm<LoginFormInputs | RegisterFormInputs>({
        resolver: zodResolver(isLogin ? loginSchema : registerSchema),
        defaultValues: {
            email: '',
            password: '',
            ...(isLogin ? {} : { username: '', confirmPassword: '' }),
        },
        mode: "onChange",
    });

    const onSubmit: SubmitHandler<LoginFormInputs | RegisterFormInputs> = (data) => {
        dispatch(reset());
        if (isLogin) {
            const { email, password } = data as LoginFormInputs;
            dispatch(loginAction({ email, password }));
        } else {
            const { username, email, password } = data as RegisterFormInputs;
            dispatch(registerAction({ username, email, password }));
        }
    };

    useEffect(() => {
        if (isSuccess && token) navigate('/dashboard');
    }, [user, token, isSuccess, navigate, dispatch]);

    useEffect(() => {
        resetForm();
        dispatch(reset());
    }, [isLogin, resetForm, dispatch]);

    const handleToggleForm = () => setIsLogin(!isLogin);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 p-4">
            <div className="w-full max-w-md bg-card-bg border border-gray-700 rounded-xl shadow-lg overflow-hidden text-light-text">
                <div className="p-5 border-b border-gray-700">
                    <motion.div key={isLogin ? 'lt' : 'st'} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <h2 className="text-2xl font-bold text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    </motion.div>
                </div>
                <div className="p-6">
                    {isError && message && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-danger/10 border border-danger/30 text-danger rounded-md flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            <span>{message}</span>
                        </motion.div>
                    )}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div key="u" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                                    <label htmlFor="username" className="field-label">
                                        <User size={16} /> Username
                                    </label>
                                    <input id="username" type="text" {...register("username")} className={`field-input ${(errors as any)?.username ? 'field-error' : ''}`} placeholder="Username" />
                                    {(errors as any)?.username && <p className="error-text">{(errors as any)?.username?.message}</p>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: isLogin ? 0 : 0.1 }}>
                            <label htmlFor="email" className="field-label">
                                <Mail size={16} /> Email
                            </label>
                            <input id="email" type="email" {...register("email")} className={`field-input ${errors.email ? 'field-error' : ''}`} placeholder="your@email.com" />
                            {errors.email && <p className="error-text">{errors.email?.message}</p>}
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: isLogin ? 0.1 : 0.2 }}>
                            <label htmlFor="password" className="field-label">
                                <Lock size={16} /> Password
                            </label>
                            <input id="password" type="password" {...register("password")} className={`field-input ${errors.password ? 'field-error' : ''}`} placeholder="••••••••" />
                            {errors.password && <p className="error-text">{errors.password?.message}</p>}
                        </motion.div>
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div key="cp" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                                    <label htmlFor="confirmPassword" className="field-label">
                                        <Lock size={16} /> Confirm Password
                                    </label>
                                    <input id="confirmPassword" type="password" {...register("confirmPassword")} className={`field-input ${(errors as any)?.confirmPassword ? 'field-error' : ''}`} placeholder="••••••••" />
                                    {(errors as any)?.confirmPassword && <p className="error-text">{(errors as any)?.confirmPassword?.message}</p>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: isLogin ? 0.2 : 0.3 }}>
                            <button type="submit" disabled={isLoading} className="submit-button">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing...
                                    </>
                                ) : (
                                    isLogin ? 'Sign In' : 'Sign Up'
                                )}
                            </button>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: isLogin ? 0.3 : 0.4 }} className="text-center text-sm text-muted-text">
                            {isLogin ? "No account?" : "Have account?"}
                            {' '}
                            <button type="button" onClick={handleToggleForm} className="toggle-button">
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </motion.div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --------------- Dashboard Component Logic ---------------
// Placeholder Page Content
const HomePageContent: React.FC = () => (
    <div className="content-card">
        <h2 className="content-title">Home Dashboard</h2>
        <p className="content-text">Welcome!</p>
    </div>
);

const ProfilePageContent: React.FC = () => {
    const { user } = useAppSelector((s) => s.auth);
    return (
        <div className="content-card">
            <h2 className="content-title">User Profile</h2>
            <div className="space-y-1">
                <p>
                    <strong className="text-muted-text">Username:</strong> {user?.username ?? 'N/A'}
                </p>
                <p>
                    <strong className="text-muted-text">Email:</strong> {user?.email ?? 'N/A'}
                </p>
            </div>
        </div>
    );
};

const SettingsPageContent: React.FC = () => (
    <div className="content-card">
        <h2 className="content-title">Settings</h2>
        <p className="content-text">Settings content.</p>
    </div>
);
const DashboardComponent: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    useLocation();
    useNavigate();
    const dispatch = useAppDispatch();
    const { user, isLoading, isError, message } = useAppSelector((s) => s.auth);

    // Fetch user data if needed (e.g., on refresh when token exists but user is null)
    useEffect(() => {
        const token = localStorage.getItem('token'); // Check token directly
        if (token && !user && !isLoading) {
            console.log("Dashboard: Token found, user missing, fetching user data...");
            dispatch(getMe());
        }
    }, [dispatch, user, isLoading]); // Removed token from deps as it's read from storage

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        /* Navigate is handled by ProtectedRoute */
    };

    const sidebarLinks = [
        { to: '.', label: 'Home', icon: <Home size={18} /> },
        { to: 'profile', label: 'Profile', icon: <User size={18} /> },
        { to: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    ];

    // Main dashboard layout
    return (
        <div className="flex h-screen bg-page-bg text-light-text">
            <motion.aside initial={{ width: '4.5rem' }} animate={{ width: isSidebarOpen ? '16rem' : '4.5rem' }} transition={{ duration: 0.3 }} className="sidebar">
                <div className="sidebar-header">
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }} className="sidebar-title">
                                App
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="sidebar-toggle">
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
                <nav className="sidebar-nav">
                    {sidebarLinks.map((l) => (
                        <NavLink key={l.label} end={l.to === '.'} to={l.to} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                            {l.icon}
                            <AnimatePresence>
                                {isSidebarOpen && (
                                    <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="whitespace-nowrap">
                                        {l.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button onClick={onLogout} className="sidebar-logout-button">
                        <LogOut size={18} className="shrink-0" />
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="whitespace-nowrap">
                                    Logout
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.aside>
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="main-header">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="sidebar-toggle md:hidden">
                        <Menu size={20} />
                    </button>
                    <div></div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-text hidden sm:inline">Hi, {user?.username ?? 'User'}</span>
                        <button onClick={onLogout} className="logout-icon-button">
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>
                <main className="main-content">
                    {isLoading && <div className='py-4 text-center'><Loader2 className='w-6 h-6 animate-spin text-muted-text inline' /></div>}
                    {isError && !isLoading && message && (
                        <div className="error-alert">
                            <AlertCircle size={16} /> {message}
                        </div>
                    )}
                    <Outlet /> {/* Render nested child routes here */}
                </main>
            </div>
        </div>
    );
};

// --------------- Protected Route Logic ---------------
const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { token, isLoading, user } = useAppSelector((state) => state.auth);
    const location = useLocation();

    // Show loader if verifying token/user state and we don't have the user yet
    if (isLoading && !user) return <div className="fixed inset-0 flex items-center justify-center bg-page-bg z-50"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    // Redirect if not loading and no token
    if (!token && !isLoading) return <Navigate to="/login" state={{ from: location }} replace />;

    // Render children if authenticated (token exists or loading finished with user)
    return <>{children}</>;
};

// --------------- Not Found Component ---------------
const NotFoundComponent: React.FC = () => (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-page-bg text-light-text">
        <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-muted-text mb-8 max-w-md">Oops! This page doesn't exist.</p>
        <NavLink to="/" className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 ring-primary ring-offset-2 ring-offset-page-bg transition">
            Go Home
        </NavLink>
    </div>
);

// --------------- Root App Component ---------------
function App(): JSX.Element {
    useEffect(() => {
        fetchCsrfToken();
    }, []); // Fetch CSRF on initial load

    return (
        // Provide Redux store to the entire app
        <Provider store={store}>
            <Router>
                <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-page-bg"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                    <Routes>
                        <Route path="/login" element={<AuthComponent />} />

                        {/* Protected Route for Dashboard */}
                        <Route path="/dashboard/*" element={<ProtectedRoute><DashboardComponent /></ProtectedRoute>}>
                            {/* Define nested routes relative to /dashboard/* directly here */}
                            {/* These will render inside DashboardComponent's <Outlet /> */}
                            <Route index element={<HomePageContent />} />
                            <Route path="profile" element={<ProfilePageContent />} />
                            <Route path="settings" element={<SettingsPageContent />} />
                            {/* Catch-all inside dashboard */}
                            <Route path="*" element={<div className="p-6 text-muted-text">Dashboard Sub-Page Not Found</div>} />
                        </Route>

                        {/* Redirect Root */}
                        <Route path="/" element={<Navigate to={localStorage.getItem('token') ? "/dashboard" : "/login"} replace />} />

                        {/* Catch-all 404 */}
                        <Route path="*" element={<NotFoundComponent />} />
                    </Routes>
                </Suspense>
            </Router>
        </Provider>
    );
}

export default App;
// Shortened motion props: i=initial, a=animate, e=exit, t=transition
